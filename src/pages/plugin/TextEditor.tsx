import React from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect } from 'dva';
import { changeData } from 'pageActions/clipper';
import { asyncRunExtension } from 'pageActions/userPreference';
import * as HyperMD from 'hypermd';
import { EditorContainer } from 'components/container';
import { isUndefined } from 'common/object';
import { GlobalStore } from 'common/types';
import { IExtensionWithId } from '@/extensions/common';
import { parse } from 'qs';

const useActions = {
  asyncRunExtension: asyncRunExtension.started,
  changeData,
};

const mapStateToProps = ({
  clipper: { clipperData },
  userPreference: { liveRendering },
}: GlobalStore) => {
  return {
    liveRendering,
    clipperData,
  };
};
type PageOwnProps = {
  pathname: string;
  search?: string;
  extension: IExtensionWithId | null;
};
type PageProps = ReturnType<typeof mapStateToProps> & typeof useActions & PageOwnProps;

const editorId = 'DiamondYuan_Love_LJ';

class ClipperPluginPage extends React.Component<PageProps, { markdown: string }> {
  private myCodeMirror: any;
  /** 屏蔽 setValue 触发的 change 事件回写 Redux */
  private isSettingValue = false;
  /** 防止 asyncRunExtension 重复派发 */
  private extensionDispatched = false;
  /** 记录上一次同步到编辑器的数据，防止重复 setValue */
  private lastSyncedData = '';

  constructor(props: any) {
    super(props);
    this.state = {
      markdown: '',
    };
  }

  checkExtension = () => {
    const { extension, clipperData, pathname, search } = this.props;
    const data = clipperData[pathname];

    // 仅在数据为空且未派发过时，触发扩展运行
    if (isUndefined(data) && extension && !this.extensionDispatched) {
      this.extensionDispatched = true;
      this.props.asyncRunExtension({
        pathname,
        extension,
      });
    }

    if (isUndefined(data) && search) {
      const content = parse(search.slice(1));
      const md = (content.markdown as string) || '';
      // 仅在内容变化时更新，防止循环
      if (md !== this.state.markdown) {
        this.setState({ markdown: md });
        this.props.changeData({
          data: md,
          pathName: this.props.pathname,
        });
      }
      return md;
    }

    if (search && !isUndefined(data)) {
      const content = parse(search.slice(1));
      const md = (content.markdown as string) || '';
      if (md !== this.state.markdown) {
        this.setState({ markdown: md });
        this.props.changeData({
          data: md,
          pathName: this.props.pathname,
        });
      }
    }

    return data || '';
  };

  componentDidUpdate = () => {
    const data = this.checkExtension();
    if (!this.myCodeMirror) {
      return;
    }
    // 仅在数据真正变化时同步到编辑器
    if (data === this.lastSyncedData) {
      return;
    }
    const value = this.myCodeMirror.getValue();
    if (data !== value) {
      this.lastSyncedData = data;
      try {
        const that = this;
        setTimeout(() => {
          that.isSettingValue = true;
          that.myCodeMirror.setValue(data);
          that.isSettingValue = false;
          that.myCodeMirror.focus();
          that.myCodeMirror.setCursor(that.myCodeMirror.lineCount(), 0);
        }, 10);
      } catch (_error) {
        this.isSettingValue = false;
      }
    }
  };

  componentDidMount = () => {
    const data = this.checkExtension();
    let myTextarea = document.getElementById(editorId) as HTMLTextAreaElement;
    this.myCodeMirror = HyperMD.fromTextArea(myTextarea, {
      lineNumbers: false,
      hmdModeLoader: false,
    });
    if (this.myCodeMirror) {
      const value = this.myCodeMirror.getValue();
      if (data !== value) {
        this.myCodeMirror.setValue(data);
        this.lastSyncedData = data;
      }
    }
    this.myCodeMirror.on('change', (editor: any) => {
      if (this.isSettingValue) {
        return;
      }
      const newValue = editor.getValue();
      this.lastSyncedData = newValue;
      this.props.changeData({
        data: newValue,
        pathName: this.props.pathname,
      });
    });
    this.myCodeMirror.setSize(800, 621);
    if (this.props.liveRendering) {
      HyperMD.switchToHyperMD(this.myCodeMirror);
    } else {
      HyperMD.switchToNormal(this.myCodeMirror);
    }
  };

  render() {
    return (
      <EditorContainer>
        <textarea id={editorId} />
      </EditorContainer>
    );
  }
}

export default connect(mapStateToProps, (dispatch: Dispatch) =>
  bindActionCreators<typeof useActions, typeof useActions>(useActions, dispatch)
)(ClipperPluginPage as React.ComponentType<PageProps>);
