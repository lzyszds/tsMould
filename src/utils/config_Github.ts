const user = {
  token: 'ghp_TVZKa1Rbzrw(lzymima)QgjrpjIOioX94UqAhMO37nXCY',
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
