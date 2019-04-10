import React from 'react';
import { Treebeard } from 'react-treebeard';

export default class Tree extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      cursor: null,
    };
  }

  shouldComponentUpdate(nextProps) {
    if (nextProps.reports.length !== this.props.reports.length) {
      return true;
    }

    for (const n in nextProps.reports.length) {
      if (nextProps.reports[n] !== this.props.reports[n]) {
        return true;
      }
    }

    return false;
  }

  render() {
    return (
      <Treebeard
        data={this.buildTree()}
        onToggle={this.onToggle.bind(this)}
      />
    );
  }

  buildTree() {
    const filepaths = this.props.reports.map(r => r.split(' ')[0]);
    const selectedFile = this.props.selectedFile;

    function getOrCreateChild(node, name, filepath) {
      // Get child if exists.
      for (const c of node.children) {
        if (c.name === name) {
          return c;
        }
      }

      const isFile = filepath.endsWith(name);

      // Child not found. Append one.
      const newChild = {
        name,
        children: [],
        filepath: isFile ? filepath : undefined,
        toggled: true,
        // toggled: !isFile,
      };

      node.children.push(newChild);

      return newChild;
    }

    const tree = {
      name: 'root',
      children: [],
      toggled: true,
    };

    // Build up directory path for each filepath provided.
    for (const fp of filepaths) {

      let visitedNode = tree;

      // Walk the path of directories, building each if they don't exist.
      const paths = fp.split('/');
      // paths.shift(); // Remove initial empty path.
      for (const p of paths) {
        visitedNode = getOrCreateChild(visitedNode, p, fp);
      }
      visitedNode = tree;
    }
    return tree;
  }

  onToggle(node, toggled) {
    if (node.filepath) {
      this.props.onSelect(node.filepath);
    }
  }

}
