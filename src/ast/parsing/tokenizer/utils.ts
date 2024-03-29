export const LINE_SPLIT_REGEXP = new RegExp(/\r?\n/g);

export function stringHexlify(str: string): string{
    let hex, i;

    let result = "";
    for (i=0; i<str.length; i++) {
        hex = str.charCodeAt(i).toString(16);
        result += ("000"+hex).slice(-4);
    }

    return result
}
