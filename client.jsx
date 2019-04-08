import React from 'react';
import ReactDOM from 'react-dom';
import 'babel-polyfill';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import py from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
SyntaxHighlighter.registerLanguage('python', py);

function dedupe(arr) {
  return [...new Set(arr.map(r => r.split(' ')[0]))]
}


class Tree extends React.Component {
  render() {
    const filenames = dedupe(this.props.reports).map(r => r.split(' ')[0])
    return <div>
      {filenames.map(f => <div onClick={() => this.props.onSelect(f)}>{f}</div>)}
    </div>
  }
}


class FrameRight extends React.Component {

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
    )
  }

  linePropsFn(lineno) {
    if (this.props.lineNumbers.includes(lineno)) {
      return { className: 'highlightLine' }
    }
  }
}


class Application extends React.Component {

  constructor(props) {
    super(props);
    this.ws = null;

    this.state = {
      reports: [],
      sources: {},
      selectedFile: null
    };
  }

  componentDidMount() {
    this.ws = new WebSocket('ws://localhost:8090/ws');
    this.ws.onmessage = this.handleMessage.bind(this);
  }

  async handleMessage(msg) {
    const reports = JSON.parse(msg.data);

    // Reduce to an array of de-duplicated filepaths excluding any which we already have sources for.
    const filepaths = dedupe(reports).filter(f => !this.state.sources.hasOwnProperty(f))

    // Sequentially get each source if we don't have it. Yes, this isn't parallelism when it could be.
    const newSources = {};
    for (const f of filepaths) {
      const res = await fetch(`http://localhost:8090/sources?filepath=${f}`);
      newSources[f] = await res.text();
    }

    // Update current reports. Merge new sources in.
    this.setState({ reports, sources: { ...this.state.sources, ...newSources } })
  }

  render() {
    return (
      <div className="container">
        <div className="left">
          <Tree
            onSelect={f => this.setState({ selectedFile: f })}
            reports={this.state.reports}
          />
        </div>
        <div className="right">
          <FrameRight
            source={this.state.selectedFile ? this.state.sources[this.state.selectedFile] : ''}
            lineNumbers={[1, 3]}
          />
        </div>
      </div>
    );
  }

}



ReactDOM.render(
  <Application />,
  document.getElementById('app')
);

module.hot.accept();
