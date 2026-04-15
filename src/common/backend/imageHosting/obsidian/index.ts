import localeService from '@/common/locales';
import { ImageHostingServiceMeta } from '../interface';
import Form from './form';
import Service from './service';

// 注册 Obsidian REST API 图床服务元数据
export default (): ImageHostingServiceMeta => {
  return {
    name: localeService.format({
      id: 'backend.imageHosting.obsidian.name',
      defaultMessage: 'Obsidian',
    }),
    icon: 'obsidian',
    type: 'obsidian',
    service: Service,
    form: Form,
    builtIn: true,
    builtInRemark: localeService.format({
      id: 'backend.imageHosting.obsidian.builtInRemark',
      defaultMessage: 'Obsidian REST API built-in image hosting',
    }),
  };
};
