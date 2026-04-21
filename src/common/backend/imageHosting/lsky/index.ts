import { ImageHostingServiceMeta } from '../interface';
import Service from './service';
import Form from './form';

export default (): ImageHostingServiceMeta => {
  return {
    name: 'Lsky Pro',
    icon: 'picture',
    type: 'lsky',
    service: Service,
    form: Form,
  };
};
