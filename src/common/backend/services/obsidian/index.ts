import localeService from '@/common/locales';
import { ServiceMeta } from './../interface';
import Service from './service';
import Form from './form';
import headerForm from './headerForm';

export default (): ServiceMeta => {
  return {
    name: localeService.format({
      id: 'backend.services.obsidian.name',
      defaultMessage: 'Obsidian',
    }),
    form: Form,
    headerForm,
    icon: 'obsidian',
    type: 'obsidian',
    service: Service,
    homePage: 'https://obsidian.md/',
  };
};
