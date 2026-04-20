import React from 'react';
import { FormattedMessage } from 'react-intl';
import useOriginPermission from '@/common/hooks/useOriginPermission';
import type { FormInstance } from 'antd';

interface UseOriginFormProps {
  form: FormInstance;
  initStatus: boolean;
  originKey?: string;
}

const useOriginForm = ({ initStatus, form, originKey }: UseOriginFormProps) => {
  const key = originKey || 'origin';
  const [verified, requestOriginPermission] = useOriginPermission(initStatus);
  const handleAuthentication = () => {
    form.validateFields([key]).then((value) => {
      requestOriginPermission(value[key]);
    }).catch(() => {
      // 校验失败，忽略
    });
  };
  const formRules = [
    {
      required: true,
      message: (
        <FormattedMessage
          id="hooks.useOriginForm.origin.message"
          defaultMessage={`Wrong format,Examples https://developer.mozilla.org`}
        />
      ),
    },
    {
      validator(_r: any, value: string) {
        if (!value) {
          return Promise.resolve();
        }
        try {
          const _url = new URL(value);
          if (_url.origin !== value) {
            form.setFieldsValue({
              [key]: _url.toString(),
            });
          }
          return Promise.resolve();
        } catch (_error) {
          return Promise.reject(
            <FormattedMessage
              id="hooks.useOriginForm.origin.message"
              defaultMessage={`Wrong format,Examples https://developer.mozilla.org`}
            />
          );
        }
      },
    },
  ];
  return { verified, handleAuthentication, formRules };
};

export default useOriginForm;
