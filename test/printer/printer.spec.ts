import { lexer } from '../../src';
import { buildMarkdownAST } from '../../src/ast/build';
import { applyProcessing } from '../../src/processing/process';
import { printMarkdownAST } from '../../src/printer/printer';

function processingChain(text: string): Record<string, string> {
    const lexerResult = lexer(text);
    const result = buildMarkdownAST(lexerResult, { filepath: 'filepath' });
    applyProcessing(result);

    const files: Record<string, string> = {};
    printMarkdownAST(result, (content, fileName) => {
        files[fileName] = content;
    });

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

\\setlength{\\intextsep}{3em}  % 3em
\\setlength{\\belowcaptionskip}{-4ex}
\\addtolength{\\belowcaptionskip}{-1em}
\\setlength{\\abovecaptionskip}{.5em}

\\begin{figure}[H]
    \\centering
    \\includegraphics[height=5cm]{./assets/img/dolphin.png}
    \\captionsetup{justification=centering,indention=0cm,labelformat=empty,margin={0pt,0cm},font={stretch=1.5}}
    \\caption{Рисунок 1 -- Image name}
\\end{figure}

\\setlength{\\intextsep}{3em}
\\setlength{\\belowcaptionskip}{-4ex}
\\addtolength{\\belowcaptionskip}{-1em}
\\setlength{\\abovecaptionskip}{-0.5em}

\\begin{figure}[H]
    \\fontsize{12}{12}\\selectfont
    \\begin{minted}
    [baselinestretch=1.2]{python}
def main():
    print "Hello World"
    \\end{minted}
    \\captionsetup{justification=centering,indention=0cm,labelformat=empty, margin={0pt, 0cm},font={stretch=1.5}}
    \\caption{Рисунок 2 -- Python Sample Code}
\\end{figure}

\\setlength{\\intextsep}{3em}  % 3em
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
\\addtolength{\\belowcaptionskip}{-1em}
\\setlength{\\abovecaptionskip}{-0.5em}

\\begin{figure}[H]
    \\fontsize{12}{12}\\selectfont
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
    \\fontsize{12}{12}\\selectfont
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

\\setlength{\\LTpre}{1.5em}
\\setlength{\\LTpost}{1.5em}

\\begin{longtable}[H]{|c|c|c|c|c|}
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

\\setlength{\\abovedisplayskip}{-1.3em}
\\setlength{\\belowdisplayskip}{0pt}
\\setlength{\\abovedisplayshortskip}{0pt}
\\setlength{\\belowdisplayshortskip}{0pt}
\\begin{align*}
    a = b + c
\\end{align*}    
`);
    });
});
