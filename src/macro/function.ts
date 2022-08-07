import { Context, ContextE, initContext } from './context';
import {
    FileNode,
    Node,
    NodeAbstract,
    NodeE,
    NodeEParentData,
    NodeType,
    OpCodeNode,
    ParagraphNode,
    TextNode,
} from '../ast/node';
import { CommandInfo } from './struct';
import { parseMacrosArguments } from './args';
import {
    DiagnoseErrorType,
    DiagnoseList,
    diagnoseListHasSeverity,
    DiagnoseSeverity,
    nodeToDiagnose,
} from '../diagnostic';
import * as command from './command';
import { processNode } from './node';

function createFallbackNode(node: Node, macroName: string): TextNode {
    return {
        type: NodeType.Text,
        parent: node.parent,
        pos: {
            ...node.pos,
        },
        text: `?${macroName}?`,
    };
}

const ALL_COMMAND_LIST: CommandInfo[] = [
    command.pictureKey,

    command.table,
    command.tableKey,

    ...command.application,
    command.applicationKey,
    command.listAllApplications,

    command.reference,
    command.referenceKey,
    command.listAllReferences,
];

export function parseMacro(
    ctx: ContextE,
    data: NodeEParentData<OpCodeNode>,
): NodeAbstract[] {
    const opCodeNode = data.node.n;
    const macros = opCodeNode.opcode.text.toUpperCase();
    const command = ALL_COMMAND_LIST.find(d => d.name.toUpperCase() === macros);
    if (!command) {
        ctx.c.diagnostic.push(
            nodeToDiagnose(
                opCodeNode,
                DiagnoseSeverity.Error,
                DiagnoseErrorType.MacrosError,
                `Unable to parse macros ${macros}`,
            ),
        );
    }

    return !command
        ? [createFallbackNode(opCodeNode, macros)]
        : applyCommandForMacros(ctx, command, data);
}

function applyCommandForMacros(
    ctx: ContextE,
    command: CommandInfo,
    data: NodeEParentData<OpCodeNode>,
): NodeAbstract[] {
    const opCodeNode = data.node.n;
    const parseResult = parseMacrosArguments(opCodeNode, command.args);
    ctx.c.diagnostic.push(...parseResult.diagnostic);
    if (
        diagnoseListHasSeverity(parseResult.diagnostic, DiagnoseSeverity.Error)
    ) {
        return [];
    }

    if (!command.labelOptional && !opCodeNode.label) {
        ctx.c.diagnostic.push(
            nodeToDiagnose(
                opCodeNode,
                DiagnoseSeverity.Error,
                DiagnoseErrorType.MacrosError,
                `Macros ${command.name} must contain label (in square brackets)`,
            ),
        );
        return [createFallbackNode(opCodeNode, command.name)];
    }

    return command.callback(
        ctx,
        {
            ...data,
        },
        {
            label: opCodeNode.label ?? undefined,
            args: parseResult.result,
        },
    );
}

export function applyMacrosFull(
    fileNode: FileNode,
    srcContext?: Context,
): DiagnoseList {
    const { context, diagnostic } = applyMacros(fileNode, srcContext);

    context.diagnostic = [];
    new ContextE(context).diagnoseAll();

    return [...diagnostic, ...context.diagnostic];
}

export interface ApplyMacrosResult {
    context: Context;
    diagnostic: DiagnoseList;
}

export function applyMacros(
    fileNode: FileNode,
    srcContext?: Context,
): ApplyMacrosResult {
    const context = new ContextE(srcContext ?? initContext(fileNode));

    // TODO: maybe make a while for nested macros

    const nodeE = new NodeE(fileNode);

    const iter = nodeE.traverseDeepDepth();
    let value = iter.next();
    while (!value.done) {
        const data = value.value;

        context.c.temp.node = data.node.n;
        if (data.node.n.type === NodeType.OpCode) {
            const nodes = parseMacro(
                context,
                data as NodeEParentData<OpCodeNode>,
            );
            data.container.splice(data.index, 1, ...(nodes as Node[]));
            value = iter.next();

            continue;
        }

        const processing = processNode(context, data);
        if (processing) {
            const container = data.container as NodeAbstract[];
            container.splice(data.index, 1, ...processing);
        }
        value = iter.next();
    }

    clearance(fileNode);

    return {
        context: context.c,
        diagnostic: context.c.diagnostic,
    };
}

/**
 * Removed empty paragraphs and commands
 * @param fileNode
 */
function clearance(fileNode: FileNode): void {
    const nodeE = new NodeE(fileNode);

    const iter = nodeE.traverse();
    let value = iter.next();
    while (!value.done) {
        const data = value.value;

        if (data.node.n.type === NodeType.Paragraph) {
            const paragraphNode = data.node.n as ParagraphNode;
            if (paragraphNode.children.length === 0) {
                data.container.splice(data.index, 1);
            }
        }

        if (data.node.n.type === NodeType.Comment) {
            data.container.splice(data.index, 1);
        }

        value = iter.next();
    }
}
