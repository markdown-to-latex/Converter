import {
    CodeNode,
    CodeSpanNode,
    CommentNode,
    FormulaNode,
    FormulaSpanNode,
    HeadingNode,
    ImageNode,
    LatexNode,
    LatexSpanNode,
    LinkNode,
    ListNode,
    NodeTableAlign,
    NodeType,
    OpCodeNode,
    ParagraphNode,
    TableControlRowNode,
    TableNode,
} from '../../../../src/ast/node';
import { applyVisitors } from '../../../../src/ast/parsing/lexer';
import { rawNodeTemplate } from './utils';

describe('code block lexer check', () => {
    test('Complex raw node', () => {
        const rawNode = rawNodeTemplate(`Sample text
\`\`\`
Code block
\`\`\`
New sample text
`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);

        let node = nodes[1] as CodeNode;
        expect(node).not.toBeUndefined();
        expect(node.type).toEqual(NodeType.Code);
        expect(node.code.text).toEqual('Code block');
        expect(rawNode.text.slice(node.pos.start, node.pos.end)).toEqual(
            '```\nCode block\n```',
        );
        expect(node.parent).toEqual(rawNode.parent);

        expect(nodes).toMatchSnapshot();
    });

    test('With language', () => {
        const rawNode = rawNodeTemplate(`Sample text
\`\`\`test-language  
Code block
\`\`\`
New sample text
`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[1] as CodeNode;
        expect(node).not.toBeUndefined();
        expect(node.type).toEqual(NodeType.Code);
        expect(node.lang?.text).toEqual('test-language');
        expect(node.code.text).toEqual('Code block');
    });

    test('With name arg', () => {
        const rawNode = rawNodeTemplate(`
\`\`\`test-language(@name Sample **Code** Block)
Code block
\`\`\`
`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[0] as CodeNode;
        expect(node).not.toBeUndefined();
        expect(node.type).toEqual(NodeType.Code);
        expect(node.lang?.text).toEqual('test-language');
        expect(node.code.text).toEqual('Code block');

        expect(node.name).toMatchSnapshot();
    });

    test('With label only', () => {
        const rawNode = rawNodeTemplate(`
\`\`\`[label]
Code block
\`\`\`
`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[0] as CodeNode;
        expect(node).not.toBeUndefined();
        expect(node.type).toEqual(NodeType.Code);
        expect(node.lang?.text).toBeUndefined();
        expect(node.label?.text).toEqual('label');
        expect(node.code.text).toEqual('Code block');
    });

    test('With all args', () => {
        const rawNode = rawNodeTemplate(`
\`\`\`test-language[label](@name Sample \`Code\` Block)
Code block
\`\`\`
`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[0] as CodeNode;
        expect(node).not.toBeUndefined();
        expect(node.type).toEqual(NodeType.Code);
        expect(node.lang?.text).toEqual('test-language');
        expect(node.label?.text).toEqual('label');
        expect(node.code.text).toEqual('Code block');

        expect(node.name).toMatchSnapshot();
    });

    test('With lang arg', () => {
        const rawNode = rawNodeTemplate(`
\`\`\`[label](@name Sample \`Code\` Block)(@lang 
    kotlin
)
Code block
\`\`\`
`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[0] as CodeNode;
        expect(node).not.toBeUndefined();
        expect(node.type).toEqual(NodeType.Code);
        expect(node.lang?.text).toEqual('kotlin');
        expect(node.label?.text).toEqual('label');
        expect(node.code.text).toEqual('Code block');

        expect(node.name).toMatchSnapshot();
    });

    test('With two lang args', () => {
        const rawNode = rawNodeTemplate(`
\`\`\`test-language[label](@name
    Sample \`Code\` Block
)(@lang 
    kotlin
)
Code block
\`\`\`
`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(1);
        let node = nodes[0] as CodeNode;
        expect(node).not.toBeUndefined();
        expect(node.type).toEqual(NodeType.Code);
        expect(node.lang?.text).toEqual('kotlin');
        expect(node.label?.text).toEqual('label');

        expect(node.name).toMatchSnapshot();
        expect(diagnostic).toMatchSnapshot();
    });

    test('Error raw node', () => {
        const rawNode = rawNodeTemplate(`Sample text
\`\`\`
Code block
New sample text
`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(1);
        expect(diagnostic).toMatchSnapshot();

        expect(nodes).toMatchSnapshot();
    });

    test('Error args node', () => {
        const rawNode = rawNodeTemplate(`Sample text
\`\`\`lang[what(argume
Code block
New sample text
`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toMatchSnapshot();
        expect(nodes).toMatchSnapshot();
    });
});

describe('link check', () => {
    test('Simple Link in text', () => {
        const rawNode = rawNodeTemplate('Hello [ti t le](li-nk) text');
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[0] as ParagraphNode;
        expect(node).not.toBeUndefined();
        expect(node.children[1].type).toEqual(NodeType.Link);

        expect(nodes).toMatchSnapshot();
    });

    test('Link with inner md in text', () => {
        const rawNode = rawNodeTemplate('Hello [ti \n`co][de` le](li-nk) text');
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[0] as ParagraphNode;
        expect(node).not.toBeUndefined();
        const linkNode = node.children[1] as LinkNode;
        expect(linkNode.type).toEqual(NodeType.Link);
        let codeSpan = linkNode.children[1] as CodeSpanNode;
        expect(codeSpan).not.toBeUndefined();
        expect(codeSpan.type).toEqual(NodeType.CodeSpan);

        expect(nodes).toMatchSnapshot();
    });
});

describe('link simple check', () => {
    test('Simple Link Simple in text', () => {
        const rawNode = rawNodeTemplate('Hello <li-nk> text');
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[0] as ParagraphNode;
        expect(node).not.toBeUndefined();
        expect(node.children[1].type).toEqual(NodeType.Link);

        expect(nodes).toMatchSnapshot();
    });

    test('Link Simple should act greedly', () => {
        const rawNode = rawNodeTemplate('Hello < a < b > text');
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[0] as ParagraphNode;
        expect(node).not.toBeUndefined();
        const link = node.children[1] as LinkNode;
        expect(link.type).toEqual(NodeType.Link);
        expect(link.href.text).toEqual(' a < b ');

        expect(nodes).toMatchSnapshot();
    });

    test('Link Simple should not be confused with guillemets', () => {
        const rawNode = rawNodeTemplate('Hello <<name>> text');
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[0] as ParagraphNode;
        expect(node).not.toBeUndefined();
        expect(node.children).toHaveLength(1);

        expect(nodes).toMatchSnapshot();
    });
});

describe('macro parsing', () => {
    test('Complex macro with name, label, pos and key args', () => {
        const rawNode = rawNodeTemplate(
            '!Macro[label-text](pos arg 1)(`pos arg` 2)(@keyArgName argName)',
        );
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[0] as ParagraphNode;
        expect(node).not.toBeUndefined();
        expect(node.children[0].type).toEqual(NodeType.OpCode);

        expect(nodes).toMatchSnapshot();
    });

    test('Nested', () => {
        const rawNode = rawNodeTemplate(`
!Macro[label-text](
    text before
    !Macro2(@key arg)
    text after
)(
    \`pos arg\` 2
)(@keyArgName 
    argName
)`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[0] as ParagraphNode;
        expect(node).not.toBeUndefined();

        const opCodeNode = node.children[0] as OpCodeNode;
        expect(opCodeNode.type).toEqual(NodeType.OpCode);
        expect(opCodeNode.posArgs).toHaveLength(2);

        const nestedOpCodeNode = opCodeNode.posArgs[0][1] as OpCodeNode;
        expect(nestedOpCodeNode).not.toBeUndefined();
        expect(nestedOpCodeNode.type).toEqual(NodeType.OpCode);

        expect(nodes).toMatchSnapshot();
    });

    test('Key is defined wrongly', () => {
        const rawNode = rawNodeTemplate('!Macro(@key)(@)');
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[0] as ParagraphNode;
        expect(node).not.toBeUndefined();
        expect(node.children[0].type).toEqual(NodeType.OpCode);

        expect(nodes).toMatchSnapshot();
    });

    test('Multiple keys error', () => {
        const rawNode = rawNodeTemplate(
            '!Macro(@key value)(@key another value)',
        );
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(1);

        const errText = rawNode.text.slice(
            diagnostic[0].pos.start.absolute,
            diagnostic[0].pos.end.absolute,
        );
        expect(errText).toEqual('key');
    });

    test('Brackets mismatch', () => {
        const rawNode = rawNodeTemplate(
            '!Macro[(@key ]value)(@key another value)',
        );
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[0] as ParagraphNode;
        expect(node).not.toBeUndefined();
        expect(node.children[0].type).toEqual(NodeType.OpCode);

        expect(nodes).toMatchSnapshot();
    });

    test('CRLF bug', () => {
        const rawNode = rawNodeTemplate(`!Macro[](@key value)(@name\r
    another value\r
)`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[0] as ParagraphNode;
        expect(node).not.toBeUndefined();
        expect(node.children[0].type).toEqual(NodeType.OpCode);

        expect(nodes).toMatchSnapshot();
    });
});

describe('table parsing', () => {
    test('Simple', () => {
        const rawNode = rawNodeTemplate(`| Column 1 | Column 2 |
| -------- | -------- |
| Value **1** | Value \`2\` |
|Value [with](link) | |`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[0] as TableNode;
        expect(node).not.toBeUndefined();
        expect(node.type).toEqual(NodeType.Table);

        expect(nodes).toMatchSnapshot();
    });

    test('With additional ', () => {
        const rawNode = rawNodeTemplate(`| Column 1 | Column 2 |
| -------- | -------- |
| Value **1** | Value \`2\` |
| --------: | :-------- |
|Value [with](link) | |`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[0] as TableNode;
        expect(node).not.toBeUndefined();
        expect(node.type).toEqual(NodeType.Table);

        expect(node.rows[0].type).toEqual(NodeType.TableRow);
        expect(node.rows[1].type).toEqual(NodeType.TableControlRow);
        expect(node.rows[2].type).toEqual(NodeType.TableRow);

        expect(nodes).toMatchSnapshot();
    });

    test('End line bug', () => {
        const rawNode = rawNodeTemplate(`|asda|asdasd|
|----|------|
|asda|asdasd|

`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[0] as TableNode;
        expect(node).not.toBeUndefined();
        expect(node.type).toEqual(NodeType.Table);

        expect(nodes).toMatchSnapshot();
    });

    test('CRLF bug', () => {
        const rawNode = rawNodeTemplate(`|asda|asdasd|\r
|----|------|\r
|asda|asdasd|\r
\r
`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[0] as TableNode;
        expect(node).not.toBeUndefined();
        expect(node.type).toEqual(NodeType.Table);

        expect(nodes).toMatchSnapshot();
    });

    test('Empty header cells, not a table', () => {
        const rawNode = rawNodeTemplate(`||||`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        expect(nodes).toHaveLength(1);
        expect(nodes[0].type).toEqual(NodeType.Paragraph);

        expect(nodes).toMatchSnapshot();
    });

    test('Empty cells', () => {
        const rawNode = rawNodeTemplate(`
|Col 1|Col 2|
|----|-----|
|Content||
`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        expect(nodes).toHaveLength(1);
        expect(nodes[0].type).toEqual(NodeType.Table);

        expect(nodes).toMatchSnapshot();
    });

    test('Fixed width', () => {
        const rawNode = rawNodeTemplate(`
|  Col 1  |  Col 2   |
|--(6cm)--|:-(5cm)--:|
| Content | Content2 |
`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        expect(nodes).toHaveLength(1);

        let node = nodes[0] as TableNode;
        expect(node).not.toBeUndefined();
        expect(node.type).toEqual(NodeType.Table);

        expect(node.header.length).toEqual(2);
        expect(node.rows.length).toEqual(1);

        const controlRow = node.header[1] as TableControlRowNode;
        expect(controlRow.children.length).toEqual(2);

        expect(controlRow.children[0].align).toEqual(NodeTableAlign.Default);
        expect(controlRow.children[0].fixedWidth).toEqual('6cm');
        expect(controlRow.children[1].align).toEqual(NodeTableAlign.Center);
        expect(controlRow.children[1].fixedWidth).toEqual('5cm');

        expect(nodes).toMatchSnapshot();
    });
});

describe('List parsing', () => {
    test('Simple ordered list', () => {
        const rawNode = rawNodeTemplate(`1. Text 1
2. Text \`2\`
3. **Text** 3`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[0] as ListNode;
        expect(node).not.toBeUndefined();
        expect(node.type).toEqual(NodeType.List);

        expect(nodes).toMatchSnapshot();
    });

    test('List with multiline items', () => {
        const rawNode = rawNodeTemplate(`1. Text 1
Additional text 1
2. Text \`2\`
3. **Text** 3
   Additional text 3`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[0] as ListNode;
        expect(node).not.toBeUndefined();
        expect(node.type).toEqual(NodeType.List);

        expect(nodes).toMatchSnapshot();
    });

    test('List with list', () => {
        const rawNode = rawNodeTemplate(`3. Text 1
Additional text 1
    - Item
    - Next Item
        - One more item \`:)\`
    - Conclusion
4. Text \`2\`
5. **Text** 3`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[0] as ListNode;
        expect(node).not.toBeUndefined();
        expect(node.type).toEqual(NodeType.List);

        expect(nodes).toMatchSnapshot();
    });

    test('List with text after', () => {
        const rawNode = rawNodeTemplate(`3. Text 1

Text`);

        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        expect(nodes).toHaveLength(2);
        expect(nodes[0].type).toEqual(NodeType.List);
        const paragraphNode = nodes[1] as ParagraphNode;
        expect(paragraphNode.type).toEqual(NodeType.Paragraph);
        expect(paragraphNode.children[0].type).toEqual(NodeType.Text);

        expect(nodes).toMatchSnapshot();
    });

    test('Unordered List with different bullets', () => {
        const rawNode = rawNodeTemplate(`
- Item 2
+ Item 3
        `);

        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        expect(nodes).toHaveLength(1);
        const list = nodes[0] as ListNode;
        expect(list.type).toEqual(NodeType.List);
        expect(list.children).toHaveLength(2);

        expect(nodes).toMatchSnapshot();
    });

    test('Unordered List with SeparatedSpecial bullets', () => {
        const rawNode = rawNodeTemplate(`Some text:
+ Item 1
+ Item 2
        `);

        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        expect(nodes).toHaveLength(2);
        const list = nodes[1] as ListNode;
        expect(list.type).toEqual(NodeType.List);
        expect(list.children).toHaveLength(2);

        expect(nodes).toMatchSnapshot();
    });

    test('Unordered List with newline separation', () => {
        const rawNode = rawNodeTemplate(`
+ Item 1
+ Item 2
+ Item 3


+ Item 4`);

        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        expect(nodes).toHaveLength(2);
        const list1 = nodes[0] as ListNode;
        const list2 = nodes[1] as ListNode;
        expect(list1.type).toEqual(NodeType.List);
        expect(list1.children).toHaveLength(3);
        expect(list2.type).toEqual(NodeType.List);
        expect(list2.children).toHaveLength(1);

        expect(nodes).toMatchSnapshot();
    });
});

describe('Heading parsing', () => {
    test('Multi-level heading parsing', () => {
        const rawNode = rawNodeTemplate(`# Header 1
## Header \`2\`
### Header 3
#### Header 4`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        for (const absNode of nodes) {
            let node = absNode as HeadingNode;
            expect(node).not.toBeUndefined();
            expect(node.type).toEqual(NodeType.Heading);
        }

        expect(nodes).toMatchSnapshot();
    });

    test('Header with text parsing', () => {
        const rawNode = rawNodeTemplate(`# Header 1

Text`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);

        expect(nodes).toMatchSnapshot();
    });
});

describe('Blockquote parsing', () => {
    test('Multi-level blockquote parsing', () => {
        const rawNode = rawNodeTemplate(`> Line 1
> Line 2
> Line 3
Text`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        expect(nodes).toHaveLength(2);
        expect(nodes[0].type).toEqual(NodeType.Blockquote);
        const paragraphNode = nodes[1] as ParagraphNode;
        expect(paragraphNode.type).toEqual(NodeType.Paragraph);
        expect(paragraphNode.children[0].type).toEqual(NodeType.Text);

        expect(nodes).toMatchSnapshot();
    });

    test('No linebreak', () => {
        const rawNode = rawNodeTemplate(`> Line 1`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        expect(nodes).toHaveLength(1);
        expect(nodes[0].type).toEqual(NodeType.Blockquote);

        expect(nodes).toMatchSnapshot();
    });
});

describe('Hr parsing', function () {
    test('Default hr', () => {
        const rawNode = rawNodeTemplate(`
-----
`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        expect(nodes).toHaveLength(1);
        expect(nodes[0].type).toEqual(NodeType.Hr);

        expect(nodes).toMatchSnapshot();
    });

    test('HR with text', () => {
        const rawNode = rawNodeTemplate(`
Text 1
-----
Text 2
`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        expect(nodes).toHaveLength(3);
        expect(nodes[0].type).toEqual(NodeType.Paragraph);
        expect(nodes[1].type).toEqual(NodeType.Hr);
        expect(nodes[2].type).toEqual(NodeType.Paragraph);

        expect(nodes).toMatchSnapshot();
    });

    test('No linebreak -> not a hr', () => {
        const rawNode = rawNodeTemplate(`-----`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        expect(nodes).toHaveLength(1);
        expect(nodes[0].type).toEqual(NodeType.Paragraph);

        expect(nodes).toMatchSnapshot();
    });
});

describe('Image parsing', () => {
    test('Markdown-like image', () => {
        const rawNode = rawNodeTemplate('![image-label](../../image.png)');
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        expect(nodes).toHaveLength(1);
        const node = nodes[0] as ImageNode;
        expect(node.type).toEqual(NodeType.Image);

        expect(nodes).toMatchSnapshot();
    });

    test('Extended image', () => {
        const rawNode = rawNodeTemplate(`![image-label](../../image.png)(
    Image Name
)(
    14cm
)`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        expect(nodes).toHaveLength(1);
        const node = nodes[0] as ImageNode;
        expect(node.type).toEqual(NodeType.Image);

        expect(nodes).toMatchSnapshot();
    });

    test('Image args error', () => {
        const rawNode = rawNodeTemplate(`![image-label](../../image.png)(
    Image Name
)(@name
    Another name
)`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(1);
        expect(diagnostic).toMatchSnapshot();
    });

    test('Image args with aliases', () => {
        const rawNode = rawNodeTemplate(`![image-label](../../image.png)(@w
    10cm
)(@n
    Name
)`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        expect(nodes).toHaveLength(1);
        const node = nodes[0] as ImageNode;
        expect(node.type).toEqual(NodeType.Image);

        expect(nodes).toMatchSnapshot();
    });
});

describe('Em parsing', () => {
    test('Em in text', () => {
        const rawNode = rawNodeTemplate(`Text with *em text*-text`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        const paragraphNode = nodes[0] as ParagraphNode;
        expect(paragraphNode.children).toHaveLength(3);
        expect(paragraphNode.children[0].type).toEqual(NodeType.Text);
        expect(paragraphNode.children[1].type).toEqual(NodeType.Em);
        expect(paragraphNode.children[2].type).toEqual(NodeType.Text);

        expect(nodes).toMatchSnapshot();
    });

    test('Em in text with sub-node', () => {
        const rawNode = rawNodeTemplate(`Text with *em\`code\` text*-text`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        const paragraphNode = nodes[0] as ParagraphNode;
        expect(paragraphNode.children).toHaveLength(3);
        expect(paragraphNode.children[0].type).toEqual(NodeType.Text);
        expect(paragraphNode.children[1].type).toEqual(NodeType.Em);
        expect(paragraphNode.children[2].type).toEqual(NodeType.Text);

        expect(nodes).toMatchSnapshot();
    });
});

describe('Strong parsing', () => {
    test('Simple strong', () => {
        const rawNode = rawNodeTemplate(`Text with **strong text**-text`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        const paragraphNode = nodes[0] as ParagraphNode;
        expect(paragraphNode.children).toHaveLength(3);
        expect(paragraphNode.children[0].type).toEqual(NodeType.Text);
        expect(paragraphNode.children[1].type).toEqual(NodeType.Strong);
        expect(paragraphNode.children[2].type).toEqual(NodeType.Text);

        expect(nodes).toMatchSnapshot();
    });

    test('Strong and strong-em', () => {
        const rawNode = rawNodeTemplate(
            `Text *em **strong** text* with **strong *em* text**-text`,
        );
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        const paragraphNode = nodes[0] as ParagraphNode;
        expect(paragraphNode.children).toHaveLength(5);
        expect(paragraphNode.children[0].type).toEqual(NodeType.Text);
        expect(paragraphNode.children[1].type).toEqual(NodeType.Em);
        expect(paragraphNode.children[2].type).toEqual(NodeType.Text);
        expect(paragraphNode.children[3].type).toEqual(NodeType.Strong);
        expect(paragraphNode.children[4].type).toEqual(NodeType.Text);

        expect(nodes).toMatchSnapshot();
    });
});

describe('Del parsing', () => {
    test('Simple del', () => {
        const rawNode = rawNodeTemplate(`Text with ==del==-text`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        const paragraphNode = nodes[0] as ParagraphNode;
        expect(paragraphNode.children).toHaveLength(3);
        expect(paragraphNode.children[0].type).toEqual(NodeType.Text);
        expect(paragraphNode.children[1].type).toEqual(NodeType.Del);
        expect(paragraphNode.children[2].type).toEqual(NodeType.Text);

        expect(nodes).toMatchSnapshot();
    });
});

describe('Underline parsing', () => {
    test('Simple underline', () => {
        const rawNode = rawNodeTemplate(`Text with _underlined_-text`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        const paragraphNode = nodes[0] as ParagraphNode;
        expect(paragraphNode.children).toHaveLength(3);
        expect(paragraphNode.children[0].type).toEqual(NodeType.Text);
        expect(paragraphNode.children[1].type).toEqual(NodeType.Underline);
        expect(paragraphNode.children[2].type).toEqual(NodeType.Text);

        expect(nodes).toMatchSnapshot();
    });
});

describe('Paragraph parsing', () => {
    test('Complex', () => {
        const rawNode = rawNodeTemplate(`## Not a paragraph
Text with **strong text**-text  
With BR break

New paragraph via break
1. List  
item 1
2. List item 3

----

## Not a paragraph 2
text`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        expect(nodes).toHaveLength(7);
        expect(nodes[0].type).toEqual(NodeType.Heading);
        expect(nodes[1].type).toEqual(NodeType.Paragraph);
        expect(nodes[2].type).toEqual(NodeType.Paragraph);
        expect(nodes[3].type).toEqual(NodeType.List);
        expect(nodes[4].type).toEqual(NodeType.Hr);
        expect(nodes[5].type).toEqual(NodeType.Heading);
        expect(nodes[6].type).toEqual(NodeType.Paragraph);

        expect(nodes).toMatchSnapshot();
    });
});

describe('Latex parsing', () => {
    test('Simple', () => {
        const rawNode = rawNodeTemplate(`Sample text
$$$raw
\\textbf{Some bold text in raw latex}
$$$
New sample text
`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[1] as LatexNode;
        expect(node).not.toBeUndefined();
        expect(node.type).toEqual(NodeType.Latex);
        expect(node.text.text).toEqual('\\textbf{Some bold text in raw latex}');

        expect(nodes).toMatchSnapshot();
    });
});

describe('Formula parsing', () => {
    test('Simple', () => {
        const rawNode = rawNodeTemplate(`Sample text
$$$
a = b + x
$$$
New sample text
`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(1); // label should be math or raw
        let node = nodes[1] as FormulaNode;
        expect(node).not.toBeUndefined();
        expect(node.type).toEqual(NodeType.Formula);
        expect(node.text.text).toEqual('a = b + x');

        expect(nodes).toMatchSnapshot();
    });

    test('With wrong target', () => {
        const rawNode = rawNodeTemplate(`$$$asdasdasd
a = b + x
$$$`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(1);
        let node = nodes[0] as FormulaNode;
        expect(node).not.toBeUndefined();
        expect(node.type).toEqual(NodeType.Formula);
        expect(node.text.text).toEqual('a = b + x');

        expect(diagnostic).toMatchSnapshot();
        expect(nodes).toMatchSnapshot();
    });

    test('With math target', () => {
        const rawNode = rawNodeTemplate(`$$$math
a = b + x
$$$`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[0] as FormulaNode;
        expect(node).not.toBeUndefined();
        expect(node.type).toEqual(NodeType.Formula);
        expect(node.text.text).toEqual('a = b + x');

        expect(nodes).toMatchSnapshot();
    });

    test('With label', () => {
        const rawNode = rawNodeTemplate(`SimpleText !FK[eq1]
$$$math[eq1]
a = x + z
$$$`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[1] as FormulaNode;
        expect(node).not.toBeUndefined();
        expect(node.type).toEqual(NodeType.Formula);
        expect(node.text.text).toEqual('a = x + z');
        expect(node.label?.text).toEqual('eq1');

        expect(nodes).toMatchSnapshot();
    });
});

describe('LatexSpan parsing', () => {
    test('Simple', () => {
        const rawNode = rawNodeTemplate(`Sample
text $$\\textbf{some inlined latex}$$
New sample text
`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        const paragraphNode = nodes[0] as ParagraphNode;
        expect(paragraphNode.children).toHaveLength(3);
        const node = paragraphNode.children[1] as LatexSpanNode;
        expect(node).not.toBeUndefined();
        expect(node.type).toEqual(NodeType.LatexSpan);
        expect(node.text).toEqual('\\textbf{some inlined latex}');

        expect(nodes).toMatchSnapshot();
    });
});

describe('FormulaSpan parsing', () => {
    test('Simple', () => {
        const rawNode = rawNodeTemplate(`Sample
text $\`a = b + h\`$
New sample text
`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        const paragraphNode = nodes[0] as ParagraphNode;
        expect(paragraphNode.children).toHaveLength(3);
        const node = paragraphNode.children[1] as FormulaSpanNode;
        expect(node).not.toBeUndefined();
        expect(node.type).toEqual(NodeType.FormulaSpan);
        expect(node.text).toEqual('a = b + h');

        expect(nodes).toMatchSnapshot();
    });
});

describe('Spaces parsing', () => {
    test('Spaces', () => {
        const rawNode = rawNodeTemplate(`hello~~world with~spaces`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        const paragraphNode = nodes[0] as ParagraphNode;
        expect(paragraphNode.children).toHaveLength(5);
        expect(paragraphNode.children[0].type).toEqual(NodeType.Text);
        expect(paragraphNode.children[1].type).toEqual(
            NodeType.NonBreakingSpace,
        );
        expect(paragraphNode.children[2].type).toEqual(NodeType.Text);
        expect(paragraphNode.children[3].type).toEqual(
            NodeType.ThinNonBreakingSpace,
        );
        expect(paragraphNode.children[4].type).toEqual(NodeType.Text);
    });
});

describe('Comment parsing', () => {
    test('Comment', () => {
        const rawNode = rawNodeTemplate(`
// line 1

line 2
`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        const commentNode = nodes[0] as CommentNode;
        expect(commentNode.type).toEqual(NodeType.Comment);
        const paragraphNode = nodes[1] as ParagraphNode;
        expect(paragraphNode.type).toEqual(NodeType.Paragraph);

        expect(nodes).toMatchSnapshot();
    });

    test('No linebreak', () => {
        const rawNode = rawNodeTemplate(`// Comment`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        expect(nodes).toHaveLength(1);
        expect(nodes[0].type).toEqual(NodeType.Comment);

        expect(nodes).toMatchSnapshot();
    });
});
