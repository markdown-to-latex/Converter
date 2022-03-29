import { LatexEscapeData, LatexInfo } from '../types';
import { Context, RequiredProperty } from '../context';
import { getConfigLatexEscapes, getContextEscapes } from '../../index';
import { NodeType } from '../../ast/nodes';

type EscaperNodeType = 'text' | 'codeSpan';

interface EscaperDataType {
    type: EscaperNodeType;
}

export class Escaper {
    public escapes: LatexEscapeData[];

    public constructor(escapes: LatexEscapeData[]) {
        this.escapes = escapes;
    }

    public static fromConfigLatex(
        config: RequiredProperty<LatexInfo>,
    ): Escaper {
        return new this(getConfigLatexEscapes(config));
    }

    public static stringArrayToRegexp(strs: string[]): RegExp {
        return new RegExp(`(${strs.join('|')})`, 'gi');
    }

    public prepare(data: { nodeType: NodeType }): EscaperReady {
        return new EscaperReady(
            this.escapes
                .filter(
                    (() => {
                        if (data.nodeType == 'CodeSpan') {
                            return d => d.inCodeSpan;
                        } else {
                            return d => d.inText;
                        }
                    })(),
                )
                .map(d => ({
                    regexp: Escaper.stringArrayToRegexp(d.chars),
                    replacer: d.replacer,
                })),
        );
    }
}

interface EscaperReadyData {
    regexp: RegExp;
    replacer: string;
}

export class EscaperReady {
    protected data: EscaperReadyData[];

    public constructor(data: EscaperReadyData[]) {
        this.data = data;
    }

    public apply(text: string): string {
        for (const data of this.data) {
            text = text.replace(data.regexp, data.replacer);
        }
        return text;
    }
}
