import { rawNodeTemplate } from '../ast/parsing/lexer/utils';
import { applyVisitors } from '../../src/ast/parsing/lexer';
import { FileNode, ParagraphNode } from '../../src/ast/node';
import { applyMacrosFull } from '../../src/macro';

describe('tables', () => {
    test('table', () => {
        const rawNode = rawNodeTemplate(`
!TK[table-label]

!T[table-label](a table)

|asda|asdasd|
|----|------|
|asda|asdasd|

`);
        const { nodes } = applyVisitors([rawNode]);
        (rawNode.parent as FileNode).children = nodes;

        const diagnostic = applyMacrosFull(rawNode.parent as FileNode);
        expect(diagnostic).toHaveLength(0);
        expect(nodes).toMatchSnapshot();
    });

    test('table with macro err', () => {
        const rawNode = rawNodeTemplate(`
!TK[table-label]

!T[table-label]

|asda|asdasd|
|----|------|
|asda|asdasd|

`);
        const { nodes } = applyVisitors([rawNode]);
        (rawNode.parent as FileNode).children = nodes;

        const diagnostic = applyMacrosFull(rawNode.parent as FileNode);
        expect(diagnostic).toHaveLength(3);
        expect(diagnostic).toMatchSnapshot();
    });

    test('error block node in the name', () => {
        const rawNode = rawNodeTemplate(`
!TK[table-label]

!T[table-label](@name
\`\`\`[a]()
The name
\`\`\`
)

|asda|asdasd|
|----|------|
|asda|asdasd|

`);
        const { nodes } = applyVisitors([rawNode]);
        (rawNode.parent as FileNode).children = nodes;

        const diagnostic = applyMacrosFull(rawNode.parent as FileNode);
        expect(diagnostic).toMatchSnapshot();
    });
});

describe('pictures', () => {
    test('multiple pictures', () => {
        const rawNode = rawNodeTemplate(`
![image-label](test.png)(@w 14cm)(@n asd)

Look at the pic. !PK[image-label-2] and !PK[image-label].

![image-label-2](test.png)(@w 14cm)(@n asd)
`);
        const { nodes } = applyVisitors([rawNode]);
        (rawNode.parent as FileNode).children = nodes;

        const diagnostic = applyMacrosFull(rawNode.parent as FileNode);
        expect(diagnostic).toHaveLength(0);
        expect(nodes).toMatchSnapshot();
    });
});

describe('formulas', () => {
    test('formula with and without label', () => {
        const rawNode = rawNodeTemplate(`
Reference to the formula: !FK[eq1].
$$$math
a = b + c
$$$
$$$math[eq1]
c = a - b
$$$
`);
        const { nodes } = applyVisitors([rawNode]);
        (rawNode.parent as FileNode).children = nodes;

        const diagnostic = applyMacrosFull(rawNode.parent as FileNode);
        expect(diagnostic).toHaveLength(0);
        expect(nodes).toMatchSnapshot();
    });
});

describe('references', () => {
    test('simple reference', () => {
        const rawNode = rawNodeTemplate(`
!R[ref-1](
    Ahn,~Byeongyong; Ik~Cho,~Nam (3~~April~~2017).
    \`Block-Matching Convolutional Neural Network for Image Denoising\`.
    arXiv:1704.00524
)

Block-Matching Convolutional Neural Network for Image Denoising described in [!RK[ref-1]].

!LAR[]
!LAA[]
`);
        const { nodes, diagnostic: diagnostic1 } = applyVisitors([rawNode]);
        (rawNode.parent as FileNode).children = nodes;

        const diagnostic = applyMacrosFull(rawNode.parent as FileNode);
        expect(diagnostic).toHaveLength(0);
        expect(nodes).toMatchSnapshot();
    });

    test('multiple references', () => {
        const rawNode = rawNodeTemplate(`
!R[ref-1](
    A
)
!R[ref-2](
    B
)
!R[ref-3](
    C
)

Block-Matching Convolutional Neural Network
for Image Denoising described in [!RK[ref-3], !RK[ref-1]].

!LAR[]
!LAA[]
`);
        const { nodes, diagnostic: diagnostic1 } = applyVisitors([rawNode]);
        (rawNode.parent as FileNode).children = nodes;

        const diagnostic = applyMacrosFull(rawNode.parent as FileNode);
        expect(diagnostic).toHaveLength(1);
        expect(diagnostic).toMatchSnapshot();
        expect(nodes).toMatchSnapshot();
    });

    // TODO: !LAR / !LAA into the table cell for example
});

describe('printer specific', () => {
    test('command', () => {
        const rawNode = rawNodeTemplate(`
!SWEARIHATEIT[](testcommand)(@d 
    - 1
    - 2
)
`);
        const { nodes, diagnostic: diagnostic1 } = applyVisitors([rawNode]);
        (rawNode.parent as FileNode).children = nodes;

        const diagnostic = applyMacrosFull(rawNode.parent as FileNode);
        expect(diagnostic).toHaveLength(0);
        expect(nodes).toMatchSnapshot();
    });
});
