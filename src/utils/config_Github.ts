const user = {
  token: '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',
  name: 'lzyszds',
}

export const headers = {
  'Authorization': `bearer ${user.token.replace('(lzymima)', '')}`,
}
const body = {
  "query": `query {
            user(login: "${user.name}") {
              name
              contributionsCollection {
                contributionCalendar {
                  colors
                  totalContributions
                  weeks {
                    contributionDays {
                      color
                      contributionCount
                      date
                      weekday
                    }
                    firstDay
                  }
                }
              }
            }
          }`
}
export const parps = JSON.stringify(body)
