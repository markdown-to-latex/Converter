import { LINE_SPLIT_REGEXP } from './regexp';
import {
    positionToTextPosition,
    splitLinesWithTextPositions,
    TextPosition,
} from '../ast/node';
import {EscaperReady} from "../printer/latex/string/escapes";

export class StringE {
    protected _string: string;

    constructor(string: string | StringE) {
        if (typeof string === 'string') {
            this._string = string;
            return;
        }

        this._string = string._string;
    }

    /**
     * [default method field proxy]
     * @see String.toLowerCase
     */
    public get lowerCase(): StringE {
        return this.toLowerCaseE();
    }

    /**
     * [default method field proxy]
     * @see String.toUpperCase
     */
    public get upperCase(): StringE {
        return this.toUpperCaseE();
    }

    /**
     * [default method field proxy]
     * @see String.trim
     */
    public get trimmed(): StringE {
        return this.trimE();
    }

    /**
     * [default method field proxy]
     * @see String.length
     */
    public get length(): number {
        return this._string.length;
    }

    /**
     * Get string value
     *
     * [md-to-latex specific]
     */
    public get s(): string {
        return this._string;
    }

    /**
     * Safe constructor
     *
     * @param string
     */
    public static from(string: string | StringE): StringE {
        return new StringE(string);
    }

    /**
     * [default method proxy]
     * @see String.charAt
     */
    public charAtE(pos: number): StringE {
        return new StringE(this._string.charAt(pos));
    }

    /**
     * [default method proxy]
     * @see String.concat
     */
    public concatE(...strings: Array<StringE | string>): StringE {
        return new StringE(this._string.concat(...(strings as string[])));
    }

    /**
     * [default method proxy]
     * @see String.replace
     */
    public replaceE(
        searchValue: string | StringE | RegExp,
        replaceValue: string | StringE,
    ): StringE {
        return new StringE(
            this._string.replace(searchValue as string, replaceValue as string),
        );
    }

    /**
     * [default method proxy]
     * @see String.slice
     */
    public sliceE(start?: number, end?: number): StringE {
        return new StringE(this._string.slice(start, end));
    }

    /**
     * [default method proxy]
     * @see String.split
     */
    public splitE(separator: string | RegExp, limit?: number): StringE[] {
        return this._string.split(separator, limit).map(d => new StringE(d));
    }

    /**
     * [default method proxy]
     * @see String.substring
     */
    public substringE(start: number, end?: number): StringE {
        return new StringE(this._string.substring(start, end));
    }

    /**
     * [default method proxy]
     * @see String.toLowerCase
     */
    public toLowerCaseE(): StringE {
        return new StringE(this._string.toLowerCase());
    }

    /**
     * [default method proxy]
     * @see String.toLocaleLowerCase
     */
    public toLocaleLowerCaseE(locales?: string | string[]): StringE {
        return new StringE(this._string.toLocaleLowerCase(locales));
    }

    /**
     * [default method proxy]
     * @see String.toUpperCase
     */
    public toUpperCaseE(): StringE {
        return new StringE(this._string.toUpperCase());
    }

    /**
     * [default method proxy]
     * @see String.toLocaleUpperCase
     */
    public toLocaleUpperCaseE(locales?: string | string[]): StringE {
        return new StringE(this._string.toLocaleUpperCase(locales));
    }

    /**
     * [default method proxy]
     * @see String.trim
     */
    public trimE(): StringE {
        return new StringE(this._string.trim());
    }

    /**
     * [default method proxy]
     * @see String.valueOf
     */
    public valueOfE(): StringE {
        return new StringE(this._string.valueOf());
    }

    /**
     * [default method proxy]
     * @see String.normalize
     */
    public normalizeE(form: 'NFC' | 'NFD' | 'NFKC' | 'NFKD'): StringE {
        return new StringE(this._string.normalize(form));
    }

    /**
     * [default method proxy]
     * @see String.repeat
     */
    public repeatE(count: number): StringE {
        return new StringE(this._string.repeat(count));
    }

    public toString(): string {
        return this._string;
    }

    /**
     * Convert to RegExp
     *
     * - d --  Generate indices for substring matches.
     * - g --  Global search.
     * - i --  Case-insensitive search.
     * - m --  Multi-line search.
     * - s --  Allows . to match newline characters.
     * - u --  "unicode"; treat a pattern as a sequence of unicode code points.
     * - y --  Perform a "sticky" search that matches starting at the current position in the target string. See sticky.
     *
     * [md-to-latex specific]
     * @param flags RegExp Flags
     */
    public toRegExp(flags?: Parameters<RegExpConstructor>[1]): RegExp {
        return new RegExp(this.s, flags);
    }

    /**
     * Apply EscaperReady class for the string.
     * Is being used for escaping some characters
     *
     * [md-to-latex specific]
     */
    public applyEscaper(escaper: EscaperReady): StringE {
        return escaper.apply(this);
    }

    public removeUnnecessaryLineBreaks(): StringE {
        return this.replaceE(/\n{3,}/g, '\n\n')
            .replaceE(/^\n+/g, '')
            .replaceE(/\n{2,}$/g, '\n');
    }

    public get lines(): StringE[] {
        return this.splitE(LINE_SPLIT_REGEXP);
    }

    public get linesWithTextPositions() {
        return splitLinesWithTextPositions(this.s);
    }

    public getLinesWithTextPositions(base: number = 0) {
        return splitLinesWithTextPositions(this.s, base);
    }

    public toTextPosition(position: number): TextPosition {
        return positionToTextPosition(this.s, position);
    }
}
