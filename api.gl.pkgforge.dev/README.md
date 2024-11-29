- #### Allowed `Endpoints`
> - `/`
> - `/api*project*`
> - `/project*`
> - `/registry*`

- #### Allowed `User-Agent`
> - `User-Agent: *dbin*`
> - `User-Agent: *pkgforge*`
> - `User-Agent: *soar*`

- #### Limits
> - https://docs.gitlab.com/ee/user/gitlab_com/index.html#gitlabcom-specific-rate-limits


| Rate limit                                                                  | Setting                        |
|-----------------------------------------------------------------------------|--------------------------------|
| Protected paths for an IP address                                           | 10 requests per minute         |
| Raw endpoint traffic for a project, commit, or file path                    | 300 requests per minute        |
| Unauthenticated traffic from an IP address                                  | 500 requests per minute        |
| Authenticated API traffic for a user                                        | 2,000 requests per minute      |
| Authenticated non-API HTTP traffic for a user                               | 1,000 requests per minute      |
| All traffic from an IP address                                              | 2,000 requests per minute      |
| Issue creation                                                              | 200 requests per minute        |
| Note creation on issues and merge requests                                  | 60 requests per minute         |
| Advanced, project, or group search API for an IP address                    | 10 requests per minute         |
| GitLab Pages requests for an IP address                                     | 1,000 requests per 50 seconds  |
| GitLab Pages requests for a GitLab Pages domain                             | 5,000 requests per 10 seconds  |
| GitLab Pages TLS connections for an IP address                              | 1,000 requests per 50 seconds  |
| GitLab Pages TLS connections for a GitLab Pages domain                      | 400 requests per 10 seconds    |
| Pipeline creation requests for a project, user, or commit                   | 25 requests per minute         |
| Alert integration endpoint requests for a project                           | 3,600 requests per hour        |
| Pull mirroring intervals                                                    | 5 minutes                      |
| API requests from a user to `/api/v4/users/:id`                             | 300 requests per 10 minutes    |
| GitLab package cloud requests for an IP address (introduced in GitLab 16.11) | 3,000 requests per minute      |
| GitLab repository files                                                     | 500 requests per minute        |
