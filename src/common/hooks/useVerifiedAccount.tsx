import { UserPreferenceStore } from '@/common/types';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { omit, isEqual } from 'lodash';
import { FormattedMessage } from 'react-intl';
import { message, Form } from 'antd';
import { useFetch } from '@shihengtech/hooks';
import type { FormInstance } from 'antd';

type UseVerifiedAccountProps = {
  form: FormInstance;
  services: UserPreferenceStore['servicesMeta'];
  initAccount?: any;
};

function useDeepCompareMemoize<T>(value: T) {
  const ref = React.useRef<T>();
  if (!isEqual(value, ref.current)) {
    ref.current = value;
  }
  return ref.current;
}

const useVerifiedAccount = ({ form, services, initAccount }: UseVerifiedAccountProps) => {
  const [type, _setType] = useState<string>(
    initAccount ? initAccount.type : Object.values(services)[0].type
  );
  const service = services[type];
  const changeType = (type: string) => {
    _setType(type);
    const values = form.getFieldsValue();
    const keysToReset = Object.keys(omit(values, ['type']));
    form.resetFields(keysToReset);
  };
  const { data, run, loading } = useFetch(
    async (info: any) => {
      const Service = service.service;
      const instance = new Service(info);
      const userInfo = await instance.getUserInfo();
      const repositories = await instance.getRepositories();
      const id = await instance.getId();
      return { userInfo, repositories, id };
    },
    [service],
    {
      auto: false,
      onError: e => {
        message.error(e.message);
      },
    }
  );

  let loadAccount = useCallback(async () => {
    try {
      const values = await form.validateFields();
      const { type, defaultRepositoryId, imageHosting, ...info } = values;
      run(info);
    } catch (_e) {
      // 表单校验失败
    }
  }, [form, run]);

  const accountStatus = {
    repositories: data?.repositories ?? [],
    userInfo: data?.userInfo ?? null,
    verified: !!data && !loading,
    id: data?.id ?? null,
  };

  let serviceForm = useMemo(() => {
    if (!service.form) {
      return null;
    }
    // antd 5: 服务表单在 <Form> 内部渲染，不再需要传 form prop
    return (
      <service.form
        verified={accountStatus.verified}
        info={initAccount}
        loadAccount={loadAccount}
      />
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountStatus.verified, initAccount, loadAccount, service.form]);

  const okText = useMemo(() => {
    if (loading) {
      return <FormattedMessage id="preference.accountList.verifying" defaultMessage="Verifying" />;
    }
    return accountStatus.verified ? (
      <FormattedMessage id="preference.accountList.add" defaultMessage="Add" />
    ) : (
      <FormattedMessage id="preference.accountList.verify" defaultMessage="Verify" />
    );
  }, [accountStatus.verified, loading]);

  let oauthLink = useMemo(() => {
    return service.oauthUrl ? (
      <a href={service.oauthUrl} target="_blank">
        <FormattedMessage id="preference.accountList.login" defaultMessage="Login" />
      </a>
    ) : null;
  }, [service.oauthUrl]);

  const _formInfo = useMemo(() => {
    const values = form.getFieldsValue();
    const { defaultRepositoryId, type: curT, imageHosting, ...info } = values;
    if (type !== curT) {
      return null;
    }
    return info;
  }, [form, type]);

  const formInfo = useDeepCompareMemoize(_formInfo);
  const verifiedRef = useRef(accountStatus.verified);
  verifiedRef.current = accountStatus.verified;

  useEffect(() => {
    if (!verifiedRef.current || !formInfo) {
      return;
    }
    run(formInfo);
  }, [verifiedRef, formInfo, run, form]);

  return {
    type,
    service,
    accountStatus: accountStatus,
    verifying: loading,
    verifyAccount: run,
    loadAccount,
    changeType,
    serviceForm,
    okText,
    oauthLink,
  };
};
export default useVerifiedAccount;
