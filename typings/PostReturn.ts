interface ResponseData<T> {
    code: 200 | 204 | 400 | 401 | 403 | 404 | 500;
    msg: string;
    data: T;
}

interface ErrorResponse {
    code: 200 | 204 | 400 | 401 | 403 | 404 | 500 | 'ER_DUP_ENTRY';
    msg: string;
}

type ErrorR = ErrorResponse | string;

export {ResponseData, ErrorR, ErrorResponse};
