import {
    applyProcessing,
    buildMarkdownAST,
    initContext,
    lexer,
    printMarkdownAST,
} from '../../src';
import { OpCodeError } from '../../src/printer/opcodes';
import { ContextError } from '../../src/printer/context';

function processingChain(text: string): Record<string, string> {
    const lexerResult = lexer(text);
    const result = buildMarkdownAST(lexerResult, { filepath: 'filepath' });
    applyProcessing(result);

    const files: Record<string, string> = {};
    const context = initContext((content, fileName) => {
        files[fileName] = content;
    });

    printMarkdownAST(result, context);

    return files;
}

describe('simple md to latex docs printer', () => {
    test('Paragraph', () => {
        const result = processingChain(`
# Header

Text
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toEqual(`\\subtitle{Header}

Text
`);
    });

    test('Subheader + List + Code Span', () => {
        const result = processingChain(`
# Header

- A
- B
- C

## Subheader

1. X
2. Y
    1. T
        - 600
        - 700
    2. \`Code span\`
3. Z
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toEqual(`\\subtitle{Header}

\\hspace{0cm}-\\,A

\\hspace{0cm}-\\,B

\\hspace{0cm}-\\,C

\\section{Subheader}

\\hspace{0cm}а)\\,X

\\hspace{0cm}б)\\,Y

\\hspace{1.25cm}1)\\,T

\\hspace{2.5cm}-\\,600

\\hspace{2.5cm}-\\,700

\\hspace{1.25cm}2)\\,\\texttt{Code span}

\\hspace{0cm}в)\\,Z
`);
    });

    test('Header + Image + Code + Image', () => {
        const result = processingChain(`
# Header

!P[img-1|5cm]
![Image name](./assets/img/dolphin.png)

!C[code-1|Python Sample Code]
\`\`\`python
def main():
    print "Hello World"
\`\`\`

!P[img-2|7cm]
![Image name 2](./assets/img/dolphin.png)
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toEqual(`\\subtitle{Header}

\\setlength{\\intextsep}{3em}
\\setlength{\\belowcaptionskip}{-4ex}
\\addtolength{\\belowcaptionskip}{-1.6em}
\\setlength{\\abovecaptionskip}{.5em}

\\begin{figure}[H]
    \\centering
    \\includegraphics[height=5cm]{./assets/img/dolphin.png}
    \\captionsetup{justification=centering,indention=0cm,labelformat=empty,margin={0pt,0cm},font={stretch=1.5}}
    \\caption{Рисунок 1 -- Image name}
\\end{figure}

\\setlength{\\intextsep}{3em}
\\setlength{\\belowcaptionskip}{-4ex}
\\addtolength{\\belowcaptionskip}{-1.6em}
\\setlength{\\abovecaptionskip}{-0.5em}

\\begin{figure}[H]
    \\fontsize{\\codefontsize}{\\codefontsize}\\selectfont
    \\begin{minted}
    [baselinestretch=1.2]{python}
def main():
    print "Hello World"
    \\end{minted}
    \\captionsetup{justification=centering,indention=0cm,labelformat=empty, margin={0pt, 0cm},font={stretch=1.5}}
    \\caption{Рисунок 2 -- Python Sample Code}
\\end{figure}

\\setlength{\\intextsep}{3em}
\\setlength{\\belowcaptionskip}{-4ex}
\\setlength{\\abovecaptionskip}{.5em}

\\begin{figure}[H]
    \\centering
    \\includegraphics[height=7cm]{./assets/img/dolphin.png}
    \\captionsetup{justification=centering,indention=0cm,labelformat=empty,margin={0pt,0cm},font={stretch=1.5}}
    \\caption{Рисунок 3 -- Image name 2}
\\end{figure}
`);
    });

    test('Code + Code', () => {
        const result = processingChain(`
# Header

Code in !PK[code-1] и !PK[code-2].

!C[code-1|Python Sample Code]
\`\`\`python
def main():
    print "Hello World"
\`\`\`

!C[code-2|Python Sample Code 2]
\`\`\`python
def hello_world():
    print "Hello World"
\`\`\`
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toEqual(`\\subtitle{Header}

Code in 1 и 2.

\\setlength{\\intextsep}{3em}
\\setlength{\\belowcaptionskip}{-4ex}
\\addtolength{\\belowcaptionskip}{-1.6em}
\\setlength{\\abovecaptionskip}{-0.5em}

\\begin{figure}[H]
    \\fontsize{\\codefontsize}{\\codefontsize}\\selectfont
    \\begin{minted}
    [baselinestretch=1.2]{python}
def main():
    print "Hello World"
    \\end{minted}
    \\captionsetup{justification=centering,indention=0cm,labelformat=empty, margin={0pt, 0cm},font={stretch=1.5}}
    \\caption{Рисунок 1 -- Python Sample Code}
\\end{figure}

\\setlength{\\intextsep}{3em}
\\setlength{\\belowcaptionskip}{-4ex}
\\setlength{\\abovecaptionskip}{-0.5em}

\\begin{figure}[H]
    \\fontsize{\\codefontsize}{\\codefontsize}\\selectfont
    \\begin{minted}
    [baselinestretch=1.2]{python}
def hello_world():
    print "Hello World"
    \\end{minted}
    \\captionsetup{justification=centering,indention=0cm,labelformat=empty, margin={0pt, 0cm},font={stretch=1.5}}
    \\caption{Рисунок 2 -- Python Sample Code 2}
\\end{figure}
`);
    });

    test('Table', () => {
        const result = processingChain(`
Demonstrated in table  

!T[table|Table with content]

|a|b|c|d|
|---|---|---|---|
|1|2|3|4|
|t|r|e|z|
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toEqual(`Demonstrated in table  

\\fontsize{\\tablefontsize}{\\tablefontsize}\\selectfont
\\setlength{\\belowcaptionskip}{0em}
\\setlength{\\abovecaptionskip}{0em}
\\setlength{\\LTpre}{1.5em}
\\setlength{\\LTpost}{1.5em}

\\begin{longtable}[H]{|c|c|c|c|}
    \\captionsetup{justification=justified,indention=0cm,labelformat=empty, margin={2pt, 0cm},font={stretch=1.5}}
    \\caption{Таблица 1 -- Table with content}
    \\\\\\hline
    a & b & c & d\\\\ \\hline

    \\endfirsthead
    \\caption{Продолжение таблицы 1} \\\\\\hline
    a & b & c & d\\\\ \\hline

    \\endhead
    \\endfoot
    \\endlastfoot

1 & 2 & 3 & 4\\\\ \\hline
t & r & e & z\\\\ \\hline

\\end{longtable}
\\fontsize{\\defaultfontsize}{\\defaultfontsize}\\selectfont\\setstretch{1.5}
`);
    });

    test('Header + Formula', () => {
        const result = processingChain(`
# Header

\`\`\`math
    a = b + c
\`\`\`
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toEqual(`\\subtitle{Header}

\\setlength{\\abovedisplayskip}{-.9em}
\\setlength{\\belowdisplayskip}{0pt}
\\setlength{\\abovedisplayshortskip}{0pt}
\\setlength{\\belowdisplayshortskip}{0pt}
\\begin{align*}
    a = b + c
\\end{align*}    
`);
    });
});

describe('Applications', () => {
    test('with list', () => {
        const result = processingChain(`
!AC[code-full|./assets/code|template-full.py|python]
!AC[code-full2|./assets/code|template-full2.py|python]
!APR[picture-large|Large scheme|./assets/img/circuit.png]
        
# Header

Code from application !AK[code-full2] describes image from application !AK[picture-large].

See application !AK[code-full].

# Applications

!LAA[]
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toEqual(`\\subtitle{Header}

Code from application А describes image from application Б.

See application В.

\\subtitle{Applications}

\\pagebreak
\\subtitle{Приложение А}

\\section*{Листинг кода из файла template-full2.py}

\\vspace{1em}
\\fontsize{\\applicationcodefontsize}{\\applicationcodefontsize}\\selectfont

\\inputminted[baselinestretch=\\applicationcodelineheight]{python}{./assets/code/template-full2.py}

\\fontsize{\\defaultfontsize}{\\defaultfontsize}\\selectfont

\\pagebreak
\\begin{landscape}
    \\thispagestyle{empty}
    \\subtitle{Приложение Б}

    \\section*{Large scheme}
    
    \\vspace{1em}
    \\begin{center}
    \\includegraphics[height=13.8cm]{./assets/img/circuit.png}
    \\end{center}

    \\vfill
    \\raisebox{.6ex}{\\makebox[\\linewidth]{\\thepage}}
\\end{landscape}

\\pagebreak
\\subtitle{Приложение В}

\\section*{Листинг кода из файла template-full.py}

\\vspace{1em}
\\fontsize{\\applicationcodefontsize}{\\applicationcodefontsize}\\selectfont

\\inputminted[baselinestretch=\\applicationcodelineheight]{python}{./assets/code/template-full.py}

\\fontsize{\\defaultfontsize}{\\defaultfontsize}\\selectfont
`);
    });

    test('with multiple columns', () => {
        const result = processingChain(`
!ACC[2]
!AC[code-full|./assets/code|template-full.py|python]
        
# Header

See application !AK[code-full].

# Applications

!LAA[]
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toEqual(`\\subtitle{Header}

See application А.

\\subtitle{Applications}

\\pagebreak
\\subtitle{Приложение А}

\\section*{Листинг кода из файла template-full.py}

\\vspace{1em}
\\fontsize{\\applicationcodefontsize}{\\applicationcodefontsize}\\selectfont
\\begin{multicols}{2}
\\inputminted[baselinestretch=\\applicationcodelineheight]{python}{./assets/code/template-full.py}
\\end{multicols}
\\fontsize{\\defaultfontsize}{\\defaultfontsize}\\selectfont
`);
    });

    test('Unused application, should throw error', () => {
        const result = () =>
            processingChain(`
!AC[code-full|./assets/code|template-full.py|python]

!LAA[]
`)['filepath'];
        expect(result).toThrow(OpCodeError);
    });

    test('Undefined application, should throw error', () => {
        const result = () =>
            processingChain(`
!AK[nope]
`)['filepath'];
        expect(result).toThrow(ContextError);
    });
});

describe('References', () => {
    test('with list', () => {
        const result = processingChain(`
!RR[ref-1]
\`\`\`ref
H.\\,Y.\\~Ignat. "Reference\\~1" // Some Journal, 1867
\`\`\`

!RR[ref-2]
\`\`\`ref
H.\\,Y.\\~Ignat. "Reference\\~2" // Some Journal, 1867
\`\`\`
        
# Header

Code from reference !RK[ref-2] describes image from reference !RK[ref-1].

# References

!LAR[]
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toEqual(`\\subtitle{Header}

Code from reference 1 describes image from reference 2.

\\subtitle{References}

0.\\,H.\\,Y.\\~Ignat. "Reference\\~2" // Some Journal, 1867

1.\\,H.\\,Y.\\~Ignat. "Reference\\~1" // Some Journal, 1867
`);
    });

    test('Unused reference, should throw error', () => {
        const result = () =>
            processingChain(`
!RR[ref]
\`\`\`ref
A.\\,A.\\~Amogus. "Impostor\\~theorem" // Steam library, 2021
\`\`\`

!LAR[]
`)['filepath'];
        expect(result).toThrow(OpCodeError);
    });

    test('Undefined reference, should throw error', () => {
        const result = () =>
            processingChain(`
!RK[nope]
`)['filepath'];
        expect(result).toThrow(ContextError);
    });

    test('Inline math', () => {
        const result = processingChain(`
Text $\`a = b + \\sum_{i=0}^\\infty c_i\`$ ending.
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result)
            .toEqual(`Text $\\displaystyle a = b + \\sum_{i=0}^\\infty c_i$ ending.
`);
    });

    test('Text with percents', () => {
        const result = processingChain(`
Text with 10% number.
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toEqual(`Text with 10\\% number.
`);
    });

    test('Text with escapes ("<" sound be corrent also)', () => {
        const result = processingChain(`
Text with \\<assdasd.
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toEqual(`Text with \\<assdasd.
`);
    });

    test('Tag <hr> should break the page', () => {
        const result = processingChain(`
The first page

---------------------------------------

The second page
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toEqual(`The first page

\\pagebreak
The second page
`);
    });

    test('Tag <br> should put additional break', () => {
        const result = processingChain(`
The first line  
The second line
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toEqual(`The first line

The second line
`);
    });

    test("Text ' dereplacement", () => {
        const result = processingChain(`
Otsu's method is a one-dimensional discrete analog of Fisher's 
Discriminant Analysis, is related to Jenks optimization method.
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result)
            .toEqual(`Otsu's method is a one-dimensional discrete analog of Fisher's 
Discriminant Analysis, is related to Jenks optimization method.
`);
    });

    test('Inline latex math dereplacement', () => {
        const result = processingChain(`
$\`a > b < c\`$
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toEqual(`$\\displaystyle a > b < c$
`);
    });

    test('Table and picture key', () => {
        const result = processingChain(`
Displayed in picture !PK[gray-square] and table !TK[table].

!P[gray-square|5cm]
![Gray square](./assets/img/example.png)

!T[table|Table]
        
|Key    |Value |
|-------|------|
|Static number | 50 |
|Random number | $$ \\showcaserandomnumber $$ |
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toEqual(`Displayed in picture 1 and table 1.

\\setlength{\\intextsep}{3em}
\\setlength{\\belowcaptionskip}{-4ex}
\\addtolength{\\belowcaptionskip}{-1.6em}
\\setlength{\\abovecaptionskip}{.5em}

\\begin{figure}[H]
    \\centering
    \\includegraphics[height=5cm]{./assets/img/example.png}
    \\captionsetup{justification=centering,indention=0cm,labelformat=empty,margin={0pt,0cm},font={stretch=1.5}}
    \\caption{Рисунок 1 -- Gray square}
\\end{figure}

\\fontsize{\\tablefontsize}{\\tablefontsize}\\selectfont
\\setlength{\\belowcaptionskip}{0em}
\\setlength{\\abovecaptionskip}{0em}
\\setlength{\\LTpre}{1.5em}
\\setlength{\\LTpost}{1.5em}

\\begin{longtable}[H]{|c|c|}
    \\captionsetup{justification=justified,indention=0cm,labelformat=empty, margin={2pt, 0cm},font={stretch=1.5}}
    \\caption{Таблица 1 -- Table}
    \\\\\\hline
    Key & Value\\\\ \\hline

    \\endfirsthead
    \\caption{Продолжение таблицы 1} \\\\\\hline
    Key & Value\\\\ \\hline

    \\endhead
    \\endfoot
    \\endlastfoot

Static number & 50\\\\ \\hline
Random number &  \\showcaserandomnumber \\\\ \\hline

\\end{longtable}
\\fontsize{\\defaultfontsize}{\\defaultfontsize}\\selectfont\\setstretch{1.5}
`);
    });
});
