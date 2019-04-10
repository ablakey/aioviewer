import React from 'react';
import ReactDOM from 'react-dom';
import 'babel-polyfill';
import Tree from './Tree';
import CodeViewer from './CodeViewer';

function dedupe(arr) {
  return [...new Set(arr.map(r => r.split(' ')[0]))];
}

class Application extends React.Component {

  constructor(props) {
    super(props);
    this.ws = null;

    this.state = {
      reports: [],
      selectedFile: null,
      sources: {},
    };
  }

  componentDidMount() {
    this.ws = new WebSocket('ws://localhost:8090/ws');
    this.ws.onmessage = this.handleMessage.bind(this);
  }

  async handleMessage(msg) {
    const reports = JSON.parse(msg.data);

    // Reduce to an array of de-duplicated filepaths excluding any which we already have sources for.
    const filepaths = dedupe(reports).filter(f => !this.state.sources.hasOwnProperty(f));

    // Sequentially get each source if we don't have it. Yes, this isn't parallelism when it could be.
    const newSources = {};
    for (const f of filepaths) {
      const res = await fetch(`http://localhost:8090/sources?filepath=${f}`);
      newSources[f] = await res.text();
    }

    // Update current reports. Merge new sources in.
    this.setState({ reports, sources: { ...this.state.sources, ...newSources } });
  }

  render() {
    const lineNumbers = this.state.reports
      .filter(r => r.split(' ')[0] === this.state.selectedFile)
      .map(r => parseInt(r.split(' ')[1], 10));

    return (
      <div className='container'>
        <div className='left'>
          <Tree
            onSelect={f => this.setState({ selectedFile: f })}
            reports={this.state.reports}
            selectedFile={this.state.selectedFile}
          />
        </div>
        <div className='right'>
          <CodeViewer
            source={this.state.selectedFile ? this.state.sources[this.state.selectedFile] : ''}
            lineNumbers={lineNumbers}
          />
        </div>
      </div>
    );
  }

}

ReactDOM.render(
  <Application />,
  document.getElementById('app'),
);

module.hot.accept();
