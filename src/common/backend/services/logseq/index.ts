import { ServiceMeta } from '../interface';
import Service from './service';
import Form from './form';

export default (): ServiceMeta => {
  return {
    name: 'Logseq',
    icon: 'book',
    type: 'logseq',
    service: Service,
    form: Form,
    homePage: 'https://logseq.com/',
  };
};
