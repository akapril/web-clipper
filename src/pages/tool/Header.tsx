import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { Form, Input, Button } from 'antd';
import Section from '@/components/section';
import { FormattedMessage } from 'react-intl';
import styles from './index.less';
import { useSelector, useDispatch } from 'dva';
import { GlobalStore, ClipperHeaderForm } from '@/common/types';
import { updateClipperHeader, asyncCreateDocument } from '@/actions/clipper';
import { isEqual } from 'lodash';
import { ServiceMeta, Repository } from '@/common/backend';
import classNames from 'classnames';
import localeService from '@/common/locales';

type PageProps = {
  pathname: string;
  service: ServiceMeta | null;
  currentRepository?: Repository;
};

const ClipperHeader: React.FC<PageProps> = props => {
  const { pathname, service, currentRepository } = props;
  const [form] = Form.useForm();
  const initializedRef = useRef(false);

  const { loading, clipperHeaderForm } = useSelector((g: GlobalStore) => {
    return {
      loading: g.loading.effects[asyncCreateDocument.started.type],
      clipperHeaderForm: g.clipper.clipperHeaderForm,
    };
  }, isEqual);
  const dispatch = useDispatch();

  // 仅首次和外部变化（如 initTabInfo）时同步 Redux → Form
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      form.setFieldsValue(clipperHeaderForm);
      return;
    }
    // 外部设置标题（如页面加载时 initTabInfo）
    const currentTitle = form.getFieldValue('title');
    if (clipperHeaderForm.title && clipperHeaderForm.title !== currentTitle) {
      form.setFieldsValue({ title: clipperHeaderForm.title });
    }
  }, [clipperHeaderForm.title, form]);

  const handleSubmit = useCallback(() => {
    form.validateFields().then((values) => {
      // 保存时把 form 值同步到 Redux
      dispatch(updateClipperHeader(values));
      // 等 Redux 更新后再触发保存
      setTimeout(() => {
        dispatch(asyncCreateDocument.started({ pathname }));
      }, 0);
    }).catch(() => {});
  }, [form, dispatch, pathname]);

  const headerForm = useMemo(() => {
    const HeaderForm = service?.headerForm;
    return HeaderForm ? <HeaderForm currentRepository={currentRepository} /> : null;
  }, [currentRepository, service]);

  return (
    <Section
      title={<FormattedMessage id="tool.title" defaultMessage="Title" />}
      className={classNames(styles.header, styles.section)}
    >
      <Form form={form} initialValues={clipperHeaderForm}>
        <Form.Item
          name="title"
          rules={[{ required: true, message: <FormattedMessage id="tool.title.required" /> }]}
        >
          <Input placeholder="Please Input Title" />
        </Form.Item>
        {headerForm}
      </Form>
      <Button
        className={styles.saveButton}
        size="large"
        type="primary"
        title={
          !currentRepository
            ? localeService.format({ id: 'tool.saveButton.noRepository' })
            : ''
        }
        onClick={handleSubmit}
        loading={loading}
        disabled={loading || pathname === '/' || !currentRepository}
        block
      >
        <FormattedMessage id="tool.save" defaultMessage="Save Content" />
      </Button>
    </Section>
  );
};

export default ClipperHeader;
