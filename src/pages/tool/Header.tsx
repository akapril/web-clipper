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
  const ref = useRef<ClipperHeaderForm>({ title: '' });
  /** 标志位：setFieldsValue 期间屏蔽 onValuesChange 回写 Redux */
  const isSyncing = useRef(false);

  const { loading, clipperHeaderForm } = useSelector((g: GlobalStore) => {
    return {
      loading: g.loading.effects[asyncCreateDocument.started.type],
      clipperHeaderForm: g.clipper.clipperHeaderForm,
    };
  }, isEqual);
  const dispatch = useDispatch();

  // Redux → Form 同步
  useEffect(() => {
    if (isEqual(clipperHeaderForm, ref.current)) {
      return;
    }
    isSyncing.current = true;
    form.setFieldsValue(clipperHeaderForm);
    ref.current = clipperHeaderForm;
    isSyncing.current = false;
  }, [clipperHeaderForm, form]);

  // Form → Redux 同步
  const handleValuesChange = useCallback((_: any, allValues: ClipperHeaderForm) => {
    // setFieldsValue 触发的变化不回写 Redux，防止循环
    if (isSyncing.current) {
      return;
    }
    if (isEqual(ref.current, allValues)) {
      return;
    }
    ref.current = allValues;
    dispatch(updateClipperHeader(allValues));
  }, [dispatch]);

  const handleSubmit = useCallback(() => {
    form.validateFields().then(() => {
      dispatch(asyncCreateDocument.started({ pathname }));
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
      <Form
        form={form}
        onValuesChange={handleValuesChange}
        initialValues={clipperHeaderForm}
      >
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
