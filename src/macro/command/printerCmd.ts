import { CommandInfo, CommandInfoCallback } from '../struct';
import {
    CodeApplicationNode,
    PictureApplicationNode,
    PrinterCmdNode,
    ProcessedNodeType,
    RawApplicationNode,
} from '../node';
import { Node, TextNode } from '../../ast/node';
import { ArgInfoType } from '../args';
import {
    DiagnoseErrorType,
    DiagnoseSeverity,
    nodeToDiagnose,
} from '../../diagnostic';
import { unpackerParagraphOnce } from '../unpack';

interface PrinterCmdArgsType {
    command?: string;
    data?: Node[];
}

const callbackPrinterCmd: CommandInfoCallback<PrinterCmdArgsType, TextNode> =
    function (ctx, data, args) {
        if (!args.args.command) {
            ctx.c.diagnostic.push(
                nodeToDiagnose(
                    data.node.n,
                    DiagnoseSeverity.Fatal,
                    DiagnoseErrorType.MacrosError,
                    'PrinterCmd macros name argument is undefined ' +
                        '(internal error)',
                ),
            );

            return [];
        }

        const node: PrinterCmdNode = {
            type: ProcessedNodeType.PrinterCmd,
            pos: { ...data.node.n.pos },
            parent: data.node.n.parent,
            command: args.args.command,
            data: args.args.data ?? [],
        };

        return [node];
    };

export default [
    {
        args: [
            {
                name: 'command',
                aliases: ['c'],
                type: ArgInfoType.Text,
                onlySpans: true,
                optional: false,
            },
            {
                name: 'data',
                // Data or Arguments
                aliases: ['d', 'a'],
                type: ArgInfoType.NodeArray,
                onlySpans: false,
                optional: true,
            },
        ],
        name: 'SWEARIHATEIT',
        callback: callbackPrinterCmd,
        unpacker: unpackerParagraphOnce,
        labelOptional: true,
    },
] as CommandInfo[];
