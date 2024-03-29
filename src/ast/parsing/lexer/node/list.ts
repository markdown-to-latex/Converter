import { TokenParser } from '../struct';
import { stringHexlify, Token, TokenType } from '../../tokenizer';
import {
    ListItemNode,
    ListNode,
    NodeType,
    RawNodeType,
    TextNode,
    TokensNode,
} from '../../../node';
import { applyVisitors, findTokenOrNull, sliceTokenText } from '../index';
import { DiagnoseList } from '../../../../diagnostic';
import { getDelimiterBreaks, isPrevTokenDelimiter } from './breaks';

export interface IsListItemResult {
    result: boolean;
    indent: number;
}

const UNORDERED_LIST_DOTS = ['*', '-', '+'];
const ORDERED_LIST_DOTS = ['.', ')'];

const ORDERED_ITEM_INDEX_REGEXP = RegExp(/^\d+$/g);

export function isOrderedListItem(
    token: Token,
    index: number,
    node: TokensNode,
): IsListItemResult {
    let indent: number = 0;
    if (token?.type === TokenType.Spacer) {
        // console.log(`[isOrdered] token spacer: "${stringHexlify(token.text)}"`)
        indent = token.text.length;
        index += 1;
        token = node.tokens[index];
    }

    if (
        !(
            token?.type === TokenType.Letter &&
            token.text.match(ORDERED_ITEM_INDEX_REGEXP)
        )
    ) {
        return {
            result: false,
            indent: 0,
        };
    }

    token = node.tokens[index + 1];
    return {
        result:
            token?.type === TokenType.SeparatedSpecial &&
            ORDERED_LIST_DOTS.indexOf(token?.text) !== -1,
        indent: indent,
    };
}

export function isUnorderedListItem(
    token: Token,
    index: number,
    node: TokensNode,
): IsListItemResult {
    let indent: number = 0;
    if (token?.type === TokenType.Spacer) {
        // console.log(`[isUnordered] token spacer: "${stringHexlify(token.text)}"`)
        indent = token.text.length;
        index += 1;
        token = node.tokens[index];
    }

    return {
        result: UNORDERED_LIST_DOTS.indexOf(token?.text) !== -1,
        indent: indent,
    };
}

interface ParseListItemResult {
    item: ListItemNode | null;
    index: number;
    diagnostic: DiagnoseList;

    itemText: string;
    ordered: boolean;
}

function parseListItem(
    tokens: TokensNode,
    index: number,
): ParseListItemResult | null {
    const beginIndex = index;
    const diagnostic: DiagnoseList = [];
    let token = tokens.tokens[index];

    if (token.type === TokenType.Delimiter && getDelimiterBreaks(token) > 2) {
        return null;
    }

    let spacers: number = 0;
    if (token.type === TokenType.Spacer) {
        // console.log(`[parseListItem] token spacer: "${stringHexlify(token.text)}"`)
        spacers = token.text.length;

        index += 1;
        token = tokens.tokens[index];
    }

    let initValue: string = '';
    let ordered: boolean;

    if (token?.type !== TokenType.Letter) {
        if (UNORDERED_LIST_DOTS.indexOf(token?.text) === -1) {
            return null;
        }

        ordered = false;
    } else {
        initValue = token.text;
        ordered = true;

        const listSeparator: Token | null = tokens.tokens[index + 1];
        if (
            !initValue.match(ORDERED_ITEM_INDEX_REGEXP) ||
            listSeparator?.type !== TokenType.SeparatedSpecial ||
            ORDERED_LIST_DOTS.indexOf(listSeparator?.text) === -1
        ) {
            return null;
        }
    }

    const sliceStart = ordered ? index + 3 : index + 2;

    // Start parsing from the next line

    let delimiter = findTokenOrNull(
        tokens,
        sliceStart,
        n => n.type === TokenType.Delimiter,
    );
    let lineDelimiterIndex = delimiter?.index ?? tokens.tokens.length;

    // Collect item text
    while (lineDelimiterIndex < tokens.tokens.length) {
        const prevIndex = lineDelimiterIndex + 1;
        if (delimiter) {
            if (getDelimiterBreaks(delimiter.token) > 2) {
                lineDelimiterIndex = lineDelimiterIndex - 1;
                break; // Found \n\n\n, start new list
            }
            if (getDelimiterBreaks(delimiter.token) > 1) {
                break; // Found \n\n, start new list item
            }
        }

        const startToken = tokens.tokens[prevIndex];

        const asOrderedListItem = isOrderedListItem(
            startToken,
            prevIndex,
            tokens,
        );
        const asUnorderedListItem = isUnorderedListItem(
            startToken,
            prevIndex,
            tokens,
        );
        if (
            (asOrderedListItem.result && asOrderedListItem.indent <= spacers) ||
            (asUnorderedListItem.result &&
                asUnorderedListItem.indent <= spacers)
        ) {
            break; // Found same-level or parent-level list item
        }

        delimiter = findTokenOrNull(
            tokens,
            lineDelimiterIndex + 1,
            n => n.type === TokenType.Delimiter,
        );
        lineDelimiterIndex = delimiter?.index ?? tokens.tokens.length;
    }

    if (sliceStart >= tokens.tokens.length) {
        return null;
    }

    const bulletEndToken = tokens.tokens[sliceStart - 1];
    const bulletTextNode: TextNode = {
        type: NodeType.Text,
        parent: tokens.parent,
        pos: {
            start: tokens.tokens[index].pos,
            end: bulletEndToken.pos + bulletEndToken.text.length,
        },
        text: sliceTokenText(tokens, index, sliceStart),
    };

    const sliceEnd = lineDelimiterIndex;
    const endToken = tokens.tokens[sliceEnd - 1];

    const listItemNode: ListItemNode = {
        type: NodeType.ListItem,
        parent: tokens.parent,
        children: [],
        pos: {
            start: tokens.tokens[beginIndex].pos,
            end: endToken.pos + endToken.text.length,
        },
        bullet: bulletTextNode,
        loose: false,
        task: false,
    };

    const startToken = tokens.tokens[sliceStart];
    const tokensNode: TokensNode = {
        type: RawNodeType.Tokens,
        tokens: tokens.tokens.slice(sliceStart, sliceEnd),
        pos: {
            start: startToken.pos,
            end: endToken.pos + endToken.text.length,
        },
        parent: listItemNode,
        text: sliceTokenText(tokens, sliceStart, sliceEnd),
    };
    const visitorsResult = applyVisitors([tokensNode]);
    diagnostic.push(...visitorsResult.diagnostic);

    listItemNode.children = visitorsResult.nodes;
    bulletTextNode.parent = listItemNode;

    return {
        item: listItemNode,
        index: sliceEnd + 1,
        diagnostic: diagnostic,
        itemText: initValue,
        ordered: ordered,
    };
}

// Blacklisted list parents
const BLACKLISTED_LIST_PARENT_NODE_TYPES: (string | undefined)[] = [
    NodeType.TableCell,
    NodeType.TableControlCell,
] as NodeType[];

export const parseList: TokenParser = function (tokens, index) {
    let token = tokens.tokens[index];
    if (!isPrevTokenDelimiter(token, index, tokens)) {
        return null;
    }

    if (
        BLACKLISTED_LIST_PARENT_NODE_TYPES.indexOf(tokens.parent?.type) !== -1
    ) {
        return null;
    }

    const diagnostic: DiagnoseList = [];
    const listItems: ListItemNode[] = [];

    let ordered: boolean | null = null;
    let initText: string | null = null;

    let nextIndex = index;
    let result = parseListItem(tokens, nextIndex);
    while (result) {
        diagnostic.push(...result.diagnostic);
        nextIndex = result.index;
        if (!result.item) {
            break;
        }
        listItems.push(result.item);

        ordered ??= result.ordered;
        initText ??= result.itemText;

        if (result.index >= tokens.tokens.length) {
            break;
        }
        result = parseListItem(tokens, nextIndex);
    }

    if (listItems.length === 0) {
        return null;
    }

    const listNode: ListNode = {
        type: NodeType.List,
        parent: tokens.parent,
        pos: {
            start: listItems[0].pos.start,
            end: listItems[listItems.length - 1].pos.end,
        },
        children: listItems,
        loose: false /* TODO: no? */,
        start: +(initText ?? '1'),
        ordered: ordered ?? false,
    };
    listItems.forEach(n => (n.parent = listNode));

    return {
        nodes: [listNode],
        diagnostic: diagnostic,
        index: nextIndex,
    };
};
