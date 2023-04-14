import { Context } from '@azure/functions'

interface ICustomerHeader {
  'Content-Type': 'application/json'
  'Cache-Control'?: string
}

export const response = (context: Context, body: any | string | undefined, status = 200): void => {
  const headers: ICustomerHeader = {
    'Content-Type': 'application/json'
  }
  if (status === 200) {
    // cache for 5 mins
    headers['Cache-Control'] = 'public, max-age=3000'
  } else if (status === 400 && typeof body === 'undefined') {
    body = { message: 'Unexpected error' }
  }
  context.res = {
    headers,
    status,
    body
  }
}
