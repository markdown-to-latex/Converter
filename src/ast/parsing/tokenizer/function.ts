import { RawNodeType, TokensNode } from '../../node';

export interface Token {
    text: string;
    pos: number;
    type: TokenType;
}

export interface TokenizeResult {
    text: string;
    tokens: Token[];
    basePos: number;
}

export const enum TokenType {
    Spacer = 'Spacer' /* Spaces, tabs */,
    SeparatedSpecial = 'SeparatedSpecial' /* Brackets, semicolons */,
    JoinableSpecial = 'JoinableSpecial' /* Octothorpe, backticks */,
    Delimiter = 'Delimiter' /* Line break */,
    Letter = 'Letter' /* Not parsed. Any language letter and numbers */,
}

export interface RegExpTokenData {
    tokenType: TokenType;
    charRegExpStr: string;
    joinable: boolean;
}

const REGEXP_CHARS = {
    spacer: ' \\t',
    separatedSpecial: '\\[\\]{}!@%\\^&()+\\\\,.\\;:\'"|№?',
    joinableSpecial: '#*\\-_\\/~=<>',
    doubleJoinableSpecial: '$`',
    delimiter: '\\r\\n',
} as const;

type RegExpTypes = keyof typeof REGEXP_CHARS | 'letter';

const REGEXP_TOKEN_DATA_BY_GROUP_NAME: Record<RegExpTypes, RegExpTokenData> = {
    spacer: {
        tokenType: TokenType.Spacer,
        charRegExpStr: `[${REGEXP_CHARS.spacer}]`,
        joinable: true,
    },
    separatedSpecial: {
        tokenType: TokenType.SeparatedSpecial,
        charRegExpStr: `[${REGEXP_CHARS.separatedSpecial}]`,
        joinable: false,
    },
    joinableSpecial: {
        tokenType: TokenType.JoinableSpecial,
        charRegExpStr: `(?<__jSpecialIn>[${REGEXP_CHARS.joinableSpecial}])\\k<__jSpecialIn>*`,
        joinable: false,
    },
    doubleJoinableSpecial: {
        tokenType: TokenType.JoinableSpecial,
        charRegExpStr: `[${REGEXP_CHARS.doubleJoinableSpecial}]`,
        joinable: true,
    },
    delimiter: {
        tokenType: TokenType.Delimiter,
        charRegExpStr: `[${REGEXP_CHARS.delimiter}]`,
        joinable: true,
    },
    letter: {
        tokenType: TokenType.Letter,
        charRegExpStr: `[^${REGEXP_CHARS.spacer}${REGEXP_CHARS.separatedSpecial}${REGEXP_CHARS.joinableSpecial}${REGEXP_CHARS.doubleJoinableSpecial}${REGEXP_CHARS.delimiter}]`,
        joinable: true,
    },
} as const;

const TOKENIZING_REGEXP = new RegExp(
    Object.entries(REGEXP_TOKEN_DATA_BY_GROUP_NAME)
        .map(([key, value]) => {
            const multiplier = value.joinable ? '+' : '';
            return `(?<${key}>${value.charRegExpStr}${multiplier})`;
        })
        .join('|'),
    'g',
);

export function tokenize(text: string, basePos: number = 0): TokenizeResult {
    const tokens = Array.from(text.matchAll(TOKENIZING_REGEXP)).flatMap(
        result => {
            const keyResult = Object.entries(REGEXP_TOKEN_DATA_BY_GROUP_NAME)
                .map(([k, v]) => [k, v, result.groups?.[k]] as const)
                .find<[string, RegExpTokenData, string]>(
                    (
                        prev: readonly [
                            string,
                            RegExpTokenData,
                            string | undefined,
                        ],
                    ): prev is [string, RegExpTokenData, string] => !!prev[2],
                );
            if (!keyResult) {
                return [];
            }

            const [key, data, regexpResult] = keyResult;
            return [
                {
                    type: data.tokenType,
                    pos: result.index,
                    text: regexpResult,
                },
            ] as Token[];
        },
    );

    return {
        text,
        basePos,
        tokens: tokens,
    };
}

export function tokensToNode(tokens: TokenizeResult): TokensNode {
    let lastToken: Token | null = tokens.tokens.length
        ? tokens.tokens[tokens.tokens.length - 1]
        : null;
    return {
        type: RawNodeType.Tokens,
        text: tokens.text,
        tokens: tokens.tokens,
        pos: {
            start: tokens.basePos,
            end: lastToken
                ? lastToken.pos + lastToken.text.length
                : tokens.basePos,
        },
        parent: null,
    };
}
