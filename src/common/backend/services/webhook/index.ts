import { ServiceMeta } from '../interface';
import Service from './service';
import Form from './form';

export default (): ServiceMeta => {
  return {
    name: 'Webhook',
    icon: 'api',
    type: 'webhook',
    service: Service,
    form: Form,
    homePage: '',
  };
};
