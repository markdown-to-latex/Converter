import { rawNodeTemplate, snapshotTestTemplateInner } from './utils';
import * as fs from 'fs';
import * as path from 'path';
import { applyVisitors } from '../../../../src/ast/parsing/lexer';

describe('Honorable mention', () => {
    test('Bold with del with code span', () =>
        snapshotTestTemplateInner('**asdas ==`lol==` adas**'));

    test('List bug', () =>
        snapshotTestTemplateInner(
            `
Image fragments are grouped together based on similarity,
*simple italic text here*
but unlike standard k-means clustering and such cluster analysis methods.
Code shown in !PK[inline-code].

![gray-square](./assets/img/example.png)(@w 6cm)(@name
    orci varius natoque penatibus et magnis dis parturient montes gray square
)
`,
        ));

    test('List item error defining bug', () =>
        snapshotTestTemplateInner(
            `
        - Item 1
        - !R[wrong 
        - Item 3
        `,
        ));

    test('List bug 2', () =>
        snapshotTestTemplateInner(
            `Blandy~J.,~~Orendorff~J.,~~Tindall~L.
Programming Rust. Fast, Safe Systems Development / Second Edition.
Sebastopol: O'Reilly Media,
2021.`,
        ));

    test('List inside table bug', () =>
        snapshotTestTemplateInner(`
| name |  a  | b   |
|------|-----|-----|
| Test | 2.5 | - a |
`));
});

test('Complex File', () => {
    const content = fs.readFileSync(
        path.join(__dirname, '__files__', 'Default.mxd'),
        'utf8',
    );
    const rawNode = rawNodeTemplate(content);

    const { nodes, diagnostic } = applyVisitors([rawNode]);
    expect(diagnostic).toHaveLength(0);
    expect(nodes).toMatchSnapshot();
});
