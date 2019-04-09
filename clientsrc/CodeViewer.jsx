import React from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import py from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

SyntaxHighlighter.registerLanguage('python', py);

export default class FrameRight extends React.Component {

  render() {
    return (
      <SyntaxHighlighter
        language={'python'}
        style={docco}
        showLineNumbers
        wrapLines
        lineProps={this.linePropsFn.bind(this)}
      >
        {this.props.source}
      </SyntaxHighlighter>
    );
  }

  linePropsFn(lineno) {
    if (this.props.lineNumbers.includes(lineno)) {
      return { className: 'highlightLine' };
    }
  }
}
