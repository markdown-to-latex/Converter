import {
    CodeNode,
    FormulaNode,
    ImageNode,
    Node,
    NodeAbstract,
    NodeChildren,
    NodeE,
    NodeType,
    TableNode,
    TextNode,
} from '../../ast/node';
import { ContextE } from '../context';

export interface ProcessingNodeData<T extends Node> {
    node: NodeE<T>;
    index: number;
    container: Node[];
}

export type ProcessingInfoCallback<T extends Node> = (
    ctx: ContextE,
    data: ProcessingNodeData<T>,
) => NodeProcessed[];

export interface ProcessingInfo<T extends Node> {
    type: NodeType;
    callback: ProcessingInfoCallback<T>;
}

export const enum ProcessedNodeType {
    TableProcessed = 'TableProcessed',
    PictureProcessed = 'PictureProcessed',
    CodeProcessed = 'CodeProcessed',
    FormulaProcessed = 'FormulaProcessed',
    FormulaNoLabelProcessed = 'FormulaNoLabelProcessed',

    PictureKey = 'PictureKey',
    TableKey = 'TableKey',
    ApplicationKey = 'ApplicationKey',
    ReferenceKey = 'ReferenceKey',
    FormulaKey = 'FormulaKey',

    PrinterCmd = 'PrinterCmd',

    AllApplications = 'AllApplications',
    AllReferences = 'AllReferences',

    RawApplication = 'RawApplication',
    PictureApplication = 'PictureApplication',
    CodeApplication = 'CodeApplication',

    PictureAmount = 'PictureAmount',
    TableAmount = 'TableAmount',

    Reference = 'Reference',

    // Internal Application nodes
}

export interface NodeProcessed extends NodeAbstract {
    type: ProcessedNodeType;
}

export interface TableProcessedNode
    extends NodeProcessed,
        Omit<TableNode, 'type'> {
    type: ProcessedNodeType.TableProcessed;
    label: TextNode;
    name: Node[];
    width?: string;
    height?: string;
    index: number;
}

export interface PictureProcessedNode
    extends NodeProcessed,
        Omit<ImageNode, 'type'> {
    type: ProcessedNodeType.PictureProcessed;
    label: TextNode;
    name: Node[];
    index: number;
}

export interface CodeProcessedNode
    extends NodeProcessed,
        Omit<CodeNode, 'type'> {
    type: ProcessedNodeType.CodeProcessed;
    label: TextNode;
    name: Node[];
    lang: TextNode;
    index: number;
    code: TextNode;
}

export interface FormulaProcessedNode
    extends NodeProcessed,
        Omit<FormulaNode, 'type'> {
    type: ProcessedNodeType.FormulaProcessed;
    label: TextNode;
    index: number;
}

export interface FormulaNoLabelProcessedNode
    extends NodeProcessed,
        Omit<FormulaNode, 'type'> {
    type: ProcessedNodeType.FormulaNoLabelProcessed;
}

export interface PictureKeyNode extends NodeProcessed {
    type: ProcessedNodeType.PictureKey;
    index: number;
}

export interface TableKeyNode extends NodeProcessed {
    type: ProcessedNodeType.TableKey;
    index: number;
}

export interface ApplicationKeyNode extends NodeProcessed {
    type: ProcessedNodeType.ApplicationKey;
    index: number;
}

export interface ReferenceKeyNode extends NodeProcessed {
    type: ProcessedNodeType.ReferenceKey;
    index: number;
}

export interface FormulaKeyNode extends NodeProcessed {
    type: ProcessedNodeType.FormulaKey;
    index: number;
}

export interface AllReferencesNode extends NodeProcessed {
    type: ProcessedNodeType.AllReferences;
    children: ReferenceNode[];
}

export interface ReferenceNode extends NodeProcessed, NodeChildren {
    type: ProcessedNodeType.Reference;
    index: number;
}

export interface AllApplicationsNode extends NodeProcessed {
    type: ProcessedNodeType.AllApplications;
    children: (NodeProcessed & NodeApplication)[];
}

export interface NodeApplication {
    index: number;
}

export interface RawApplicationNode
    extends NodeProcessed,
        NodeApplication,
        NodeChildren {
    type: ProcessedNodeType.RawApplication;
}

export interface PictureApplicationNode
    extends NodeProcessed,
        NodeApplication,
        Omit<
            PictureProcessedNode,
            'type' | 'name' | 'label' | 'index' | 'href'
        > {
    type: ProcessedNodeType.PictureApplication;
    href: string;
    title: Node[];
    rotated: boolean;
}

export interface CodeApplicationNode extends NodeProcessed, NodeApplication {
    type: ProcessedNodeType.CodeApplication;
    columns: number;
    lang: string;
    directory: string;
    filename: string;
}

export interface PictureAmountNode extends NodeProcessed {
    type: ProcessedNodeType.PictureAmount;

    // TODO: get rid of lambdas
    numberLazy: () => number;
}

export interface TableAmountNode extends NodeProcessed {
    type: ProcessedNodeType.TableAmount;

    // TODO: get rid of lambdas
    numberLazy: () => number;
}

export interface PrinterCmdNode extends NodeProcessed {
    type: ProcessedNodeType.PrinterCmd;

    command: string;
    data: Node[];
}
