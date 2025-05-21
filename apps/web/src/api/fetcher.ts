// import { isEmptyObject } from '@/utils/utils.service';
// import { axios } from 'axios';

// type RequestConfig<TData = unknown> = {
//   baseUrl?: string;
//   url: string;
//   method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
//   params?: {
//     [key: string]: any;
//   };
//   data?: BodyType<TData | FormData>;
//   responseType?:
//     | 'json'
//     | 'text'
//     | 'blob'
//     | 'arraybuffer'
//     | 'document'
//     | 'stream'
//     | (string & NonNullable<unknown>);
//   signal?: AbortSignal;
//   headers?: {
//     [key: string]: string;
//   };
// };

// type RequestFetcherOptions = {
//   options?: {
//     isFile?: boolean;
//   };
//   apiInstance: any;
// };

// export interface ResponseConfig<TData = unknown> extends Response {
//   data: TData;
// }

// export const APIClient = async <TData, TError = unknown, TVariables = unknown>(
//   config: RequestConfig<TVariables>,
//   requestOptions: RequestFetcherOptions,
// ): Promise<ResponseConfig<TData>> => {
//   if (!requestOptions?.apiInstance) {
//     throw new Error('API instance is not provided');
//   }

//   let url = config.url;
//   if (!isEmptyObject(config.params)) {
//     url += `?${new URLSearchParams(config.params).toString()}`;
//   }

//   const promise = requestOptions.apiInstance.fetch(url, {})
// };
