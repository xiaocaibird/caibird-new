# caibird

## 序

&emsp;&emsp;我一直认为typescript对前端的代码质量和开发效率的提升意义非常重大。

&emsp;&emsp;所谓“善战者无赫赫之功，善医者无煌煌之名”，如果能把typescript用好，它就是前端代码质量和开发效率的“善战者和善医者”。

## 版本

    v4.0-RC

&emsp;&emsp;3.0之前也实现了类型同构，但整体功能非常重，接入成本也比较高。

&emsp;&emsp;4.0后将专注于做一个`MVC+DI+类型同构`的通用型框架，接入成本低且将拥抱开源。

## 安装

    npm i caibird@rc

## 简介

&emsp;&emsp;首先说明，这里的后端指的nodejs服务端。现在大部分前端项目，都有自己的nodejs服务，可能仅做为接入层和简单的BFF层，也可能有更多的后端职责。

&emsp;&emsp;一般情况下，nodejs端(以下统称为：`server端`)的代码也会和前端(以下统称为：`client端`)的代码放在一个工程里管理。可即使在同一个工程里，当我们在server端开发完业务api，并在client端调用时，想要获取api的字段类型，通常要做不少额外工作。

&emsp;&emsp;另外当我们需要快速从调用方(client端)的逻辑，跳转到被调用方(server端)的逻辑时，也不能像一个函数调用一样快速跳转。


&emsp;&emsp;所以这里抛出一个合理的猜想：

    既然在一个工程里了，是否有办法能让业务功能在开发过程中，
    零成本的接入client端到server端的类型检查以及快速调试？

&emsp;&emsp;于是我就想到了要做“前后端类型同构”，关键能力如下：

1. 提供client+server的跨端类型同构能力
1. 提供server端api(nodejs api)的方法级调用能力
1. 完全基于ts和koa，无需任何中间层和额外的协议文件，在开发时能随时响应api的字段变化
1. 在开发时能直接从client端跳转到server端的api代码或参数字段

## server端示例

```ts
// src/server/index.ts
// 服务端入口
import Koa from 'koa';
import { controllersRouter } from 'caibird';

import * as Controllers from './controllers';

const app = new Koa();

app.use(controllersRouter({
    Controllers
}, app));

app.listen(8080, '127.0.0.1');

```

```ts
// src/server/controllers/test.ts
import { Controller, httpMethodFilter, View, BaseController } from 'caibird';

@httpMethodFilter('POST')
@Controller()
export class TestController extends BaseController {
    @httpMethodFilter(['POST', 'GET'])
    public async getConfig(reqData: { obj: { a: string, b: number } }) {
        return { prop12: true };
    }

    public async getMsg() {
        return '你好';
    }

    @httpMethodFilter('GET')
    public async toUrl(reqData: { url: string }) {
        return View.Redirect(reqData.url);
    }
}

```

## client端示例

```ts

import { ApiService } from 'caibird/client';

// CaibirdGlobal 是一个跨端的全局类型命名空间，CaibirdGlobal.Controllers是所有server端的Controller类型
const apiService = new ApiService<CaibirdGlobal.Controllers>({
    transformGetMethodJsonData: {
        enabled: true,
        queryKey: 'caibirdurljsonparamskey',
    },
});

const fn = async () => {
    // 仅获取response data
    const res1 = await apiService.call.Test.getConfig({ obj: { a: '', b: 0 } }, { httpMethod: 'GET' });
    // 获取完整的response body
    const res2 = await apiService.call.Test.getConfig({ obj: { a: '', b: 0 } }, { isRaw: true });

    console.log(res1);
    console.log(res2);
}

fn();

```

## 核心模块

### `Controller`装饰器

1. 用于标记需要`controllersRouter中间件`(以下简称`中间件`)处理的controller

1. options：

    ```ts
    type Options = {
        // 命名后缀，一般不用传。 默认为'Controller'。
        // 需要与中间件的controllerSuffix配合使用
        suffix?: string
    };
    ```

1. 核心概念：
    1. action：controller中的一个方法，对应一个接口响应
    1. filter：可灵活组合，拦截进入controller或action的请求，实现AOP

### koa中间件：`controllersRouter`

1. options字段说明:

    ```ts
    type Options = {
        // 传入所有自定义的controllers，必填
        Controllers: UninitControllers;

        // koa-body的配置，传false可禁用自动 use koa-body
        koaBodyOptions?: KoaBodyMiddlewareOptions | false;
        
        // koa-views的配置，传false可禁用自动 use koa-views
        koaViewsOptions?: KoaViewsOptions | false;

        // url路由前缀，一般需要与client端的ApiService对应配置一起使用。默认为空
        prefix?: string;
        
        /* controller命名后缀，默认为'Controller'
        若定义的名称为：TestController，那么在url路由和调用中的名称会识别为Test
        若定义的名称为：TestCtrl，则保持不变 */
        controllerSuffix?: string;
        
        /* 当路由里缺省controllerName或actionName时对应的默认值
        可设置："localhost/" "localhost/user" 这类短地址默认指向的controller和action */
        defaultPathMatchs?: RoutePathMatchs;
        
        /* 全局默认filter，当controller和action没有同类filter时，会执行这里的filter */
        globalFilters?: Filter.BindConfig[];
        
        /* 接口响应状态为success时，json body里的code。默认为0
        如要自定义，需要与client端的ApiService对应配置一起使用 */
        successCode?: number;
        
        // 开启后，get请求会从queryKey读取并解析reqData。需和ApiService的对应配置一起使用
        transformGetMethodJsonData?: {
            enabled: boolean;
            queryKey: string;
        };
        
        /* 可自定义传入action的reqData */
        getRequestData?: (nowReqData: object, ctx: Context) => InnerDeclares.MayPromise<object>;
        
        /* 在接口设置json body前，可做最后修改 */
        getJsonBody?: (nowJsonBody: object, context: Context) => InnerDeclares.MayPromise<object>;
        
        /* 在接口响应Response前，可做最后调整 */
        onResponse?: (ctx: Context, next: Next) => InnerDeclares.MayPromise<void>;
    };
    ```

### clinet端接口调用：`ApiService`

1. `new ApiService<TControllers, TControllerSuffix>(initOptions)`
    
    1. 泛型TControllers：必须是个object，其中每个值都要是一个Controller，或是Controller的实例
    
    1. 泛型TControllerSuffix：一般不传，默认为'Controller'，和中间件的controllerSuffix配合使用
        
    1. Options: 
        ```ts
        // 以下大部分字段，除了可以直接提供最终值，也可以提供一个同步或异步函数以获取最终值
        type InitOptions = {
            // 重试次数，默认不重试
            retry?: number;
            
            // 默认为 "/"
            origin?: ValueOrFunc<string, OmitUrlPreCallFuncParams>;
            
            // 请求api时统一在url上加的前缀，一般要和中间件的对应配置一起使用。默认为空
            prefix?: ValueOrFunc<string, OmitUrlPreCallFuncParams>;
            
            // 当接口返回json数据时，哪些code会认为success状态，一般要和中间件的对应配置一起使用。
            // 默认为：[0]
            successCodes?: ValueOrFunc<SuccessCodes, PostCallFuncParams>;
            
            // 超时时间。默认为空
            timeout?: PreCallValueOrFunc<number>;
            
            // 默认为POST
            httpMethod?: PreCallValueOrFunc<HttpMethod>;
            
            // 默认为空，content-type等字段如果没有设置，会在请求时根据数据类型自动设置。
            headers?: PreCallValueOrFunc<Record<string, number | string>>;
            
            // 默认的公共请求数据，每次请求都会带上，极端场景才会用到。
            commonReqData?: PreCallValueOrFunc<ReqData>;
            
            // 公共的axios RequestConfig
            baseRequestConfig?: PreCallValueOrFunc<BaseRequestConfig>;
            
            // 开启后，get请求会将reqData序列化后用queryKey传递。需和中间件的对应配置一起使用
            transformGetMethodJsonData?: {
                enabled: boolean;
                queryKey: string;
            };
            
            // 在发起请求前，最后调整axios RequestConfig
            getFinallyRequestConfig?: (params: PreCallFuncParams & {
                nowRequestConfig: RequestConfig;
            }) => InnerDeclares.MayPromise<RequestConfig>;
            
            // 获取到Response后，可进行预处理
            onReturnResponse?: (params: PostCallFuncParams) => InnerDeclares.MayPromise<Response<ResData, RawResponse>>;
            
            // 异常处理
            onError?: (error: unknown, params: OmitUrlPreCallFuncParams) => InnerDeclares.MayPromise<unknown>;
        };
        ```
2. `apiService.call.controller.action(reqData, callOptions)`
    
    1. reqData：根据对应的controller.action自动映射类型
    
    1. callOptions：
        ```ts
        // 可传所有InitOptions中的字段，并覆盖
        type CallOptions = InitOptions & {
            /* 为false时，会先判断code是否success，非success的code会直接抛异常 
            为true时会得到原始接口回包，开发者需自行判断状态码code是否符合预期。
            对应的返回类型也会因isRaw的值不同而变化。
            默认为false */
            isRaw?: boolean;
            
            /* 是否使用formData请求接口 */
            isFormData?: boolean;
        }
        ```
    1. return类型:  
          1. isRaw为false或不传，return的类型为接口数据类型(response Data)
          1. isRaw为true时，return的类型为原始回包(response Body)

### 其它模块
1. View：
    
    用于让action响应除了json body以外的数据类型。目前添加了几个常用的，之后会持续丰富：
    1. View.Redirect：302跳转
    2. View.StaticFile：返回静态文件
    3. View.Render：渲染html
    4. View.Buffer：返回buffer数据
    5. View.Xml：返回xml数据
1. createFilter：
    
    创建自定义filter，如权限验证等。

    1. 内置filter：httpMethodFilter