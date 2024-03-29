import { TokenParser, TokenPredicate } from '../struct';
import { TokenType } from '../../tokenizer';
import { applyVisitors, findTokenOrNull, sliceTokenText } from '../index';
import {
    NodeTableAlign,
    NodeType,
    RawNodeType,
    TableCellNode,
    TableControlCellNode,
    TableControlRowNode,
    TableNode,
    TableRowNode,
    TokensNode,
} from '../../../node';
import {
    DiagnoseErrorType,
    DiagnoseList,
    DiagnoseSeverity,
    nodeToDiagnose,
} from '../../../../diagnostic';
import { isPrevTokenDelimiter } from './breaks';

const isTableControlCell: TokenPredicate = function (token, index, node) {
    if (token.type === TokenType.Spacer) {
        token = node.tokens[index + 1];
    }
    if (!token) {
        return false;
    }

    if (
        [TokenType.JoinableSpecial, TokenType.SeparatedSpecial].indexOf(
            token.type,
        ) === -1
    ) {
        return false;
    }

    return token.text.startsWith('-') || token.text.startsWith(':');
};

interface ParseControlCellResult {
    align?: NodeTableAlign;
    fixedWidth?: string;
    joinRowsUp?: number;
    joinColsRight?: number;

    diagnostic: DiagnoseList;
}

function parseControlCell(text: string): ParseControlCellResult {
    text = text.trim();
    const diagnostic: DiagnoseList = [];

    const align: NodeTableAlign = (() => {
        if (text.startsWith(':') && text.endsWith(':')) {
            return NodeTableAlign.Center;
        }
        if (text.startsWith(':')) {
            return NodeTableAlign.Left;
        }
        if (text.endsWith(':')) {
            return NodeTableAlign.Right;
        }

        return NodeTableAlign.Default;
    })();

    const width: string | undefined = (() => {
        const leftBracketIdx = text.indexOf('(');
        const rightBracketIdx = text.indexOf(')');
        if (
            leftBracketIdx !== -1 &&
            rightBracketIdx !== -1 &&
            leftBracketIdx < rightBracketIdx
        ) {
            return text.slice(leftBracketIdx + 1, rightBracketIdx);
        }
    })();

    return {
        align,
        fixedWidth: width,

        // TODO: Add join rows parsing

        diagnostic,
    };
}

export const isTableLine: TokenPredicate = function (token, index, node) {
    if (!isPrevTokenDelimiter(node.tokens[index], index, node)) {
        return false;
    }

    if (!(token.type === TokenType.SeparatedSpecial && token.text === '|')) {
        return false;
    }

    const delimiter = findTokenOrNull(
        node,
        index,
        n => n.type === TokenType.Delimiter,
    );
    const lineEndTokenIndex = (delimiter?.index ?? node.tokens.length) - 1;
    if (lineEndTokenIndex === index) {
        return false;
    }

    const lineEndToken = node.tokens[lineEndTokenIndex];
    return (
        lineEndToken.type === TokenType.SeparatedSpecial &&
        lineEndToken.text === '|'
    );
};

interface ParseTableLineResult {
    line: TableRowNode | TableControlRowNode | null;
    diagnostic: DiagnoseList;
}

function parseTableLine(
    tokens: TokensNode,
    startIndex: number,
    endIndex: number,
): ParseTableLineResult {
    const startToken = tokens.tokens[startIndex];
    const endToken = tokens.tokens[endIndex];
    if (
        !(
            startToken.type === TokenType.SeparatedSpecial &&
            startToken.text === '|' &&
            endToken.type === TokenType.SeparatedSpecial &&
            endToken.text === '|'
        )
    ) {
        return {
            line: null,
            diagnostic: [],
        };
    }

    const result: ParseTableLineResult = {
        line: {
            type: NodeType.TableRow,
            parent: null,
            pos: {
                start: startToken.pos,
                end: endToken.pos + endToken.text.length,
            },
            children: [],
        },
        diagnostic: [],
    };
    let curIndex = startIndex;
    while (curIndex < endIndex) {
        const nextBar = findTokenOrNull(
            tokens,
            curIndex + 1,
            t => t.type === TokenType.SeparatedSpecial && t.text === '|',
        )!;
        // TODO: handle null

        const innerTokens = tokens.tokens.slice(curIndex + 1, nextBar.index);
        const slicedText = sliceTokenText(tokens, curIndex + 1, nextBar.index);

        const isControlCell =
            innerTokens.length !== 0
                ? isTableControlCell(innerTokens[0], curIndex + 1, tokens)
                : false;
        let cellNode: TableControlCellNode | TableCellNode;

        if (innerTokens.length !== 0 && isControlCell) {
            const controlParserResult = parseControlCell(slicedText);
            result.diagnostic.push(...controlParserResult.diagnostic);

            cellNode = {
                type: NodeType.TableControlCell,
                parent: result.line,
                pos: {
                    start: tokens.tokens[curIndex + 1].pos,
                    end: tokens.tokens[nextBar.index].pos,
                },

                // TODO: encapsulate into an object
                align: controlParserResult.align,
                fixedWidth: controlParserResult.fixedWidth,
                joinRowsUp: controlParserResult.joinRowsUp,
                joinColsRight: controlParserResult.joinColsRight,
            } as TableControlCellNode;

            result.line!.children.push(cellNode as any);
            result.line!.type = NodeType.TableControlRow;
        } else {
            cellNode = {
                type: NodeType.TableCell,
                parent: result.line,
                pos: {
                    start: tokens.tokens[curIndex + 1].pos,
                    end: tokens.tokens[nextBar.index].pos,
                },
                children: [],
            } as TableCellNode;

            const partialTokenNode: TokensNode = {
                type: RawNodeType.Tokens,
                tokens: innerTokens,
                text: slicedText,
                parent: cellNode,
                pos: {
                    start: tokens.tokens[curIndex + 1].pos,
                    end: tokens.tokens[nextBar.index].pos,
                },
            };
            const parseResult = applyVisitors([partialTokenNode]);
            result.diagnostic.push(...parseResult.diagnostic);

            cellNode.children = parseResult.nodes;
            result.line!.children.push(cellNode as any);
        }

        if (!isControlCell && result.line!.type == NodeType.TableControlRow) {
            result.diagnostic.push(
                nodeToDiagnose(
                    cellNode,
                    DiagnoseSeverity.Error,
                    DiagnoseErrorType.ApplyParserError,
                    'Expected control sequence, got text',
                ),
            );
            result.line!.type = NodeType.TableRow;
        }

        curIndex = nextBar.index;
    }

    return result;
}

export const parseTable: TokenParser = function (tokens, index) {
    // TODO: parse control rows separately

    const diagnostic: DiagnoseList = [];
    const rows: (TableRowNode | TableControlRowNode)[] = [];

    let delimiter: ReturnType<typeof findTokenOrNull> | null = null;
    let lineDelimiterIndex: number = index - 1;
    let lastTokenIndex: number = index;

    while (lineDelimiterIndex + 1 < tokens.tokens.length) {
        delimiter = findTokenOrNull(
            tokens,
            lineDelimiterIndex + 1,
            n => n.type === TokenType.Delimiter,
        );

        const prevIndex = lineDelimiterIndex + 1;
        lineDelimiterIndex = delimiter?.index ?? tokens.tokens.length;

        const lineResult = parseTableLine(
            tokens,
            prevIndex,
            lineDelimiterIndex - 1,
        );
        diagnostic.push(...lineResult.diagnostic);

        if (!lineResult.line) {
            break;
        }

        lastTokenIndex = lineDelimiterIndex - 1;
        rows.push(lineResult.line);
    }

    if (diagnostic.length !== 0) {
        return {
            diagnostic: diagnostic,
            index: lastTokenIndex + 1,
            nodes: [],
        };
    }
    if (rows.length < 2) {
        return null;
    }
    if (rows[0].type !== NodeType.TableRow) {
        diagnostic.push(
            nodeToDiagnose(
                rows[0],
                DiagnoseSeverity.Error,
                DiagnoseErrorType.ApplyParserError,
                'The first table row must be not control',
            ),
        );
    }
    if (rows[1].type !== NodeType.TableControlRow) {
        diagnostic.push(
            nodeToDiagnose(
                rows[1],
                DiagnoseSeverity.Error,
                DiagnoseErrorType.ApplyParserError,
                'The second table row must be control',
            ),
        );
    }

    const endToken = tokens.tokens[lastTokenIndex];
    const tableNode: TableNode = {
        type: NodeType.Table,
        header: [rows[0] as TableRowNode, rows[1] as TableControlRowNode],
        rows: rows.slice(2),
        pos: {
            start: tokens.tokens[index].pos,
            end: endToken.pos + endToken.text.length,
        },
        parent: tokens.parent,
    };
    rows.forEach(n => (n.parent = tableNode));

    return {
        nodes: [tableNode],
        index: lastTokenIndex + 1,
        diagnostic: diagnostic,
    };
};
