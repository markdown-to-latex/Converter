import * as nodes from '../macro/node/index';
import { ProcessedNodeType } from './node';

const ProcessedNodesByTypeMap = {
    [ProcessedNodeType.TableProcessed]: {} as nodes.TableProcessedNode,
    [ProcessedNodeType.PictureProcessed]: {} as nodes.PictureProcessedNode,
    [ProcessedNodeType.CodeProcessed]: {} as nodes.CodeProcessedNode,
    [ProcessedNodeType.FormulaProcessed]: {} as nodes.FormulaProcessedNode,
    [ProcessedNodeType.FormulaNoLabelProcessed]:
        {} as nodes.FormulaNoLabelProcessedNode,
    [ProcessedNodeType.PictureKey]: {} as nodes.PictureKeyNode,
    [ProcessedNodeType.TableKey]: {} as nodes.TableKeyNode,
    [ProcessedNodeType.ApplicationKey]: {} as nodes.ApplicationKeyNode,
    [ProcessedNodeType.ReferenceKey]: {} as nodes.ReferenceKeyNode,
    [ProcessedNodeType.FormulaKey]: {} as nodes.FormulaKeyNode,
    [ProcessedNodeType.PrinterCmd]: {} as nodes.PrinterCmdNode,
    [ProcessedNodeType.AllApplications]: {} as nodes.AllApplicationsNode,
    [ProcessedNodeType.AllReferences]: {} as nodes.AllReferencesNode,
    [ProcessedNodeType.RawApplication]: {} as nodes.RawApplicationNode,
    [ProcessedNodeType.PictureApplication]: {} as nodes.PictureApplicationNode,
    [ProcessedNodeType.CodeApplication]: {} as nodes.CodeApplicationNode,
    [ProcessedNodeType.Reference]: {} as nodes.ReferenceNode,
    [ProcessedNodeType.PictureAmount]: {} as nodes.PictureAmountNode,
    [ProcessedNodeType.TableAmount]: {} as nodes.TableAmountNode,
} as const;

export type ProcessedNodesByType = typeof ProcessedNodesByTypeMap;

// Compile-time interface validation
const _ = ProcessedNodesByTypeMap as {
    [Key in ProcessedNodeType]: nodes.NodeProcessed;
};
