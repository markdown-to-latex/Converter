import { StartEndPosition } from './position';
import { Token } from '../parsing/tokenizer';

export const enum RawNodeType {
    Raw = 'Raw',
    Tokens = 'Tokens',
    SoftBreak = 'SoftBreak', // One \n
    ParagraphBreak = 'ParagraphBreak', // Multiple \n
    TextBreak = 'TextBreak', // Two spaces and one \n
}

export const enum NodeType {
    // Default MarkDown Nodes
    Code = 'Code',
    Heading = 'Heading',
    Table = 'Table',
    TableCell = 'TableCell',
    TableRow = 'TableRow',
    Blockquote = 'Blockquote',
    List = 'List',
    ListItem = 'ListItem',
    Paragraph = 'Paragraph',
    Escape = 'Escape',
    Text = 'Text',
    Link = 'Link',
    Image = 'Image',
    Strong = 'Strong',
    Em = 'Em', // italic
    Hr = 'Hr',
    CodeSpan = 'CodeSpan',
    Br = 'Br',
    Del = 'Del', // through-lined text

    // Custom
    Underline = 'Underline',
    File = 'File',
    TableControlCell = 'TableControlCell',
    TableControlRow = 'TableControlRow',
    OpCode = 'OpCode',
    LatexSpan = 'LatexSpan',
    Latex = 'Latex',
    Formula = 'Formula',
    FormulaSpan = 'FormulaSpan',
    NonBreakingSpace = 'NonBreakingSpace',
    ThinNonBreakingSpace = 'ThinNonBreakingSpace',

    Comment = 'Comment',
}

/**
 * Is being used in command arguments
 */
export const SPAN_NODE_TYPES: NodeType[] = [
    NodeType.Escape,
    NodeType.Text,
    NodeType.Link,
    NodeType.Strong,
    NodeType.Em,
    NodeType.CodeSpan,
    NodeType.Br,
    NodeType.Del,
    NodeType.Underline,
    NodeType.LatexSpan,
    NodeType.FormulaSpan,
    NodeType.Comment,
];

/**
 * The nodes, that will be wrapped into the paragraph
 */
export const TEXT_LIKE_NODES: NodeType[] = [
    NodeType.Escape,
    NodeType.Text,
    NodeType.Link,
    NodeType.Strong,
    NodeType.Em,
    NodeType.CodeSpan,
    NodeType.Br,
    NodeType.Del,
    NodeType.Underline,
    NodeType.OpCode,
    NodeType.LatexSpan,
    NodeType.FormulaSpan,
    NodeType.NonBreakingSpace,
    NodeType.ThinNonBreakingSpace,
];

/**
 * The structure:
 * ```
 * - File node
 *    |- Paragraph-like node
 *    |      - Text-like node
 *    |      - .....
 *    |      - Text-like node
 *    |- ...
 *    |- Paragraph-like node
 *    |      - Text-like node
 *    |      - .....
 *    |      - Text-like node
 * - ...
 * - File node
 *    |- Paragraph-like node
 *    |      - Text-like node
 *    |      - .....
 *    |      - Text-like node
 *    |- ...
 *    |- Paragraph-like node
 *    |      - Text-like node
 *    |      - .....
 *    |      - Text-like node
 * ```
 */
export const PARAGRAPH_LIKE_NODES: NodeType[] = [
    NodeType.Paragraph,
    NodeType.Code,
    NodeType.Heading,
    NodeType.Blockquote,
    NodeType.List,
    NodeType.Image,
    NodeType.Latex,
    NodeType.Formula,
    NodeType.Table,
    NodeType.Hr,
];

/**
 * Control nodes and
 * nodes that can be occurred only inside a container node
 */
export const SPECIAL_NODES: NodeType[] = [
    NodeType.File,
    NodeType.TableControlCell,
    NodeType.TableControlRow,
    NodeType.TableRow,
    NodeType.TableCell,
    NodeType.ListItem,
    NodeType.Comment,
];

export type StartEndNumberPosition = StartEndPosition<number>;

export interface NodeAbstract {
    type: string;
    parent: NodeAbstract | null;
    pos: StartEndNumberPosition;
}

export interface Node extends NodeAbstract {
    type: NodeType | RawNodeType;
}

export interface NodeChildren {
    children: Node[];
}

export interface NodeText {
    text: string;
}

export interface NodeTextNode {
    text: TextNode;
}

export interface NodeHref {
    href: TextNode;
}

export interface NodeArgs {
    posArgs: Node[][];
    keys: Record<string, TextNode>;
    keyArgs: Record<string, Node[]>;
}

export interface RawNode extends Node, NodeText {
    type: RawNodeType.Raw;
}

export interface TokensNode extends Node, NodeText {
    type: RawNodeType.Tokens;
    tokens: Token[];
}

export interface SoftBreakNode extends Node {
    type: RawNodeType.SoftBreak;
}

export interface ParagraphBreakNode extends Node {
    type: RawNodeType.ParagraphBreak;
}

export interface TextBreakNode extends Node {
    type: RawNodeType.TextBreak;
}

export interface CodeNode extends Node {
    type: NodeType.Code;
    code: TextNode; // TODO: inherit from NodeTextNode
    lang?: TextNode;
    name?: Node[];
    label?: TextNode;
}

export interface HeadingNode extends Node, NodeChildren {
    type: NodeType.Heading;
    depth: number;
}

export interface TableNode extends Node {
    type: NodeType.Table;
    header: [TableRowNode, TableControlRowNode];
    rows: (TableRowNode | TableControlRowNode)[];
}

export interface BlockquoteNode extends Node, NodeChildren {
    type: NodeType.Blockquote;
}

// TODO: split ListNode into OrderedListNode and UnorderedListNode
export interface ListNode extends Node, NodeChildren {
    type: NodeType.List;
    ordered: boolean;
    start: number | '';
    loose: boolean;
}

export interface ListItemNode extends Node, NodeChildren {
    type: NodeType.ListItem;
    bullet: TextNode;
    task: boolean;
    checked?: boolean;
    loose: boolean;
}

export interface ParagraphNode extends Node, NodeChildren {
    type: NodeType.Paragraph;
    pre?: boolean;
}

export interface EscapeNode extends Node, NodeText {
    type: NodeType.Escape;
}

export interface TextNode extends Node, NodeText {
    type: NodeType.Text;
}

export interface LinkNode extends Node, NodeHref, NodeChildren {
    type: NodeType.Link;
}

export interface ImageNode extends Node, NodeHref {
    type: NodeType.Image;
    label: TextNode;
    name?: Node[];
    width?: string;
    height?: string;
}

export interface StrongNode extends Node, NodeChildren {
    type: NodeType.Strong;
}

export interface EmNode extends Node, NodeChildren {
    type: NodeType.Em;
}

export interface CodeSpanNode extends Node, NodeText {
    type: NodeType.CodeSpan;
}

export interface BrNode extends Node {
    type: NodeType.Br;
}

export interface HrNode extends Node {
    type: NodeType.Hr;
}

export interface DelNode extends Node, NodeChildren {
    type: NodeType.Del;
}

export interface UnderlineNode extends Node, NodeChildren {
    type: NodeType.Underline;
}

export interface FileNode extends Node, NodeChildren {
    type: NodeType.File;
    path: string;
    raw: string;
}

export interface TableCellNode extends Node, NodeChildren {
    type: NodeType.TableCell;
}

export interface TableRowNode extends Node, NodeChildren {
    type: NodeType.TableRow;
    children: TableCellNode[];
}

export const enum NodeTableAlign {
    Default = 'Default',
    Left = 'Left',
    Right = 'Right',
    Center = 'Center',
}

export interface TableControlCellNode extends Node {
    type: NodeType.TableControlCell;
    align?: NodeTableAlign;
    fixedWidth?: string;
    joinRowsUp?: number;
    joinColsRight?: number;
}

export interface TableControlRowNode extends Node, NodeChildren {
    type: NodeType.TableControlRow;
    children: TableControlCellNode[];
}

export interface OpCodeNode extends Node, NodeArgs {
    type: NodeType.OpCode;
    opcode: TextNode;
    label: TextNode | null;
}

export interface LatexNode extends Node, NodeTextNode {
    type: NodeType.Latex;
    target?: TextNode;
}

export interface LatexSpanNode extends Node, NodeText {
    type: NodeType.LatexSpan;
}

export interface FormulaNode extends Node, NodeTextNode {
    type: NodeType.Formula;
    target?: TextNode;
    label?: TextNode;
}

export interface FormulaSpanNode extends Node, NodeText {
    type: NodeType.FormulaSpan;
}

export interface NonBreakingSpaceNode extends Node {
    type: NodeType.NonBreakingSpace;
}

export interface ThinNonBreakingSpaceNode extends Node {
    type: NodeType.ThinNonBreakingSpace;
}

export interface CommentNode extends Node {
    type: NodeType.Comment;
}
