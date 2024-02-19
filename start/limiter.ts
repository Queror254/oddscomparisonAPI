/*
|--------------------------------------------------------------------------
| Define HTTP rate limiters
|--------------------------------------------------------------------------
|
| The "Limiter.define" method callback receives an instance of the HTTP
| context you can use to customize the allowed requests and duration
| based upon the user of the request.
|
*/

import { Limiter } from '@adonisjs/limiter/build/services'

export const { httpLimiters } = Limiter
  .define('global', (ctx) => {

    return Limiter.allowRequests(1000).every('1 min')
      .store('db')
    // .limitExceeded((error) => {
    //   error.message = 'Rate limit exceeded'
    //  error.status = 429

    //  console.log(error.headers)
    //  })

  })
