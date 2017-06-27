# Common Form API Server

This package bundles the API server powering
<https://api.commonform.org>, the "back end" for
<https://commonform.org>.

The server stores Common Form objects, publisher information,
publications, annotations, and subscriptions.  With Mailgun
credentials, it also sends e-mail notifications for changes to which
publishers subscribe.

## Running a Server

To run a Common Form API server of your own, using [pm2] to manage
logging, configuration, and monitoring:

1.  Install [Node.js].

2.  Install software:

    ```bash
    npm install --global pm2 tcp-log-server commonform-server
    ```

3.  Start a [tcp-log-server]:

    ```bash
    pm2 start tcp-log-server
    ```

4.  Start the Common Form API server,
    setting an administrator password:

    ```bash
    ADMINISTRATOR_PASSWORD="..." pm2 start commonform-server
    ```

[Node.js]: https://nodejs.org

[pm2]: https://www.npmjs.com/package/pm2

[tcp-log-server]: https://www.npmjs.com/package/tcp-log-server

By default, the API server will listen for HTTP requests on port 8080.
You should firewall remote connections to 4444 and 8080 and configure
[NGINX] or another reverse proxy to:

1.  Redirect port 80 HTTP request to TLS on port 443 and set
    [Strict Transport Security][rfc6797] headers.

2.  Terminate TLS.
    <https://api.commonform.org> uses [Let's Encrypt] via [Certbot].

3.  Proxy requests to port 8080.

4.  Set headers for [CORS] if you need them.

[NGINX]: https://www.nginx.com/

[Let's Encrypt]: https://www.nginx.com/

[Certbot]: https://certbot.eff.org/

[rfc6797]: https://tools.ietf.org/html/rfc6797

[CORS]: https://www.w3.org/TR/cors/

See [commonform-nginx] for example configuration.

[commonform-nginx]: https://github.com/commonform/commonform-nginx

## API

The API server serves all data via HTTP 1.1.

Endpoints are described as [RFC 6570] templates.
Strings like `{digest}` are placeholders.

[RFC 6570]: https://tools.ietf.org/html/rfc6570

All served and accepted is JSON.
Values like `"$label"` below are placeholders.

Access-restricted endpoints require HTTP Basic authentication.
Use TLS.

### Service Metadata

#### GET /

```json
{
  "service": "commonform-server",
  "version": "$version"
}
```

### Forms

#### GET /forms/{digest}

Serves a Common Form with the given hex-encoded, SHA256 digest,
according to [commonform-normalize].

[commonform-normalize]: https://www.npmjs.com/package/commonform-normalize

#### POST /forms

Authentication: Required

Body: Common Form object meeting the requirements of [commonform-validate].

[commonform-validate]: https://www.npmjs.com/package/commonform-validate

#### GET /forms/{digest}/parents

```json
[
  {
    "digest": "$digest",
    "depth": "$depth"
  }
]
```

where `$depth` is a `Number` indicating the depth within which
`{digest}` is nested within `$digest`, minimum `0`.

### Publishers

#### GET /publishers

```json
[
  {
    "publisher": "$publisher",
    "about": "$about"
  }
]
```

#### GET /publishers/{publisher}/projects

```json
["$project_name"]
```

#### GET /publishers/{publisher}/projects/{project}/publications

```json
["$edition"]
```

where each `$edition` is a [Reviewers Edition].

[Reviewers Edition]: https://www.npmjs.com/package/reviewers-edition-parse

#### GET /publishers/{publisher}/projects/{project}/publications/{edition}

```json
{"digest": "$digest"}
```

#### GET /publishers/{publisher}/projects/{project}/publications/current

```json
{"digest": "$digest"}
```

where `$digest` corresponds to the latest non-draft edition.

#### GET /publishers/{publisher}/projects/{project}/publications/latest

```json
{"digest": "$digest"}
```

where `$digest` corresponds to the latest edition, which may be a draft.

#### GET /publishers/{publisher}/projects/{project}/publications/{edition}/form

Redirects to the corresponding `/forms/{digest}`.

#### GET /publishers/{publisher}/projects/{project}/publications/current/form

Redirects to the corresponding `/forms/{digest}`.

#### GET /publishers/{publisher}/projects/{project}/publications/latest/form

Redirects to the corresponding `/forms/{digest}`.

#### POST /publishers/{publisher}

Authentication: `administrator:$ADMINISTRATOR_PASSWORD`

Body:
```json
{
  "email": "$email",
  "about": "$about",
  "password": "$password"
}
```

Creates a new publisher.

#### DELETE /publishers/{publisher}

Authentication: Administrator

#### POST /publishers/{publisher}/projects/{project}/publications/{edition}

Authentication: Publisher

Body:
```json
{"digest": "$digest"}
```

#### PUT /publishers/{publisher} to update

Authentication: Publisher

Body:
```json
{
  "email": "$email",
  "about": "$about",
  "password": "$password"
}
```

### Annotations

#### GET /annotation/{uuid}

```json
{
  "publisher": "$publisher",
  "form": "$digest",
  "context": "$digest",
  "replyTo": ["$uuid"],
  "text": "$string"
}
```

where:

-  `"form"` is the form to which the annotation pertains.

-  `"context"` is the form containing `"form"` in which the annotation
   is relevant.  `"context"` equals `"form"` is the annotation is
   relevant wherever the form appears.

-  `"replyTo"` is an array of annotation UUIDs to which this annotation
   responds, latest first.

#### DELETE /annotation/{uuid}

Delete an annotation.

Publishers may only delete comments without any replies.

#### GET /annotations?context={context}

```json
[
  {
    "publisher": "$publisher",
    "form": "$digest",
    "context": "$digest",
    "replyTo": ["$uuid"],
    "text": "$string"
  }
]
```

where `{context}` is a form digest and each `Object` in the `Array` is
an annotation to a form in `{context}` in the context of `{context}`.

#### GET /annotations?context={context}&form={form}

```json
[
  {
    "publisher": "$publisher",
    "form": "{form}",
    "context": "$digest",
    "replyTo": ["$uuid"],
    "text": "$string"
  }
]
```

where `{context}` is a form digest, `{form}` is the digest of a form
within `{context}`, and each `Object` in the `Array` is an annotation
to `{form}` in the context of `{context}`.

#### POST /annotations

Authentication: Publisher

```json
{
  "publisher": "$publisher",
  "form": "$digest",
  "context": "$digest",
  "replyTo": ["$uuid"],
  "text": "$string"
}
```

See `GET /annotations/{uuid}`.

#### DELETE /annotation/{uuid}

Authorization: Publisher

### Indexed Namespaces

The API server indexes several namespaces used in forms.  Except form
digests, which are always lower-case, all names are stored and queried
without regard to letter case.

The server only indexes _published_ forms.  It does _not_ index forms
provided via `POST /forms` until they are referenced by a request
body to `POST /publishers/{}/projects/{}/publication/{}`.

| Namespace | Relations    | Type   | That...                |
|-----------|--------------|--------|------------------------|
| terms     | definitions  | forms  | define term            |
| terms     | uses         | forms  | use term               |
| headings  | forms        | (same) | appear under heading   |
| headings  | references   | forms  | reference heading      |
| forms     | headings     | (same) | appear under heading   |
| forms     | publications | (same) | reference form         |
| projects  | publishers   | (same) | have used project name |
| digests   |              |        | summarize forms        |

Forms are named by digest.

#### GET /{namespace}{?prefix}

List names in `{namespace}`, optionally limiting to only those
beginning with `{prefix}.

For example: `GET /terms?prefix=indem`.

#### GET /{namespace}/{name}/{relations}{?skip,limit}

List the relations of a name, optionally limiting the number of
results and skipping a given number of initial results.

### Subscriptions

Publishers can create subscriptions to API objects that trigger e-mail
notifications on relevant changes:

| POST                                               | Events       |
|----------------------------------------------------|--------------|
| `/annotations/{uuid}/subscribers/{subscriber}`     | replies      |
| `/forms/{digest}/subscribers`                      | annotations  |
| `/forms/{digest}/subscribers`                      | publications |
| `/publishers/{publisher}/subscribers/{subscriber}` | publications |

Publishers can `GET` the same endpoints to check whether they are
subscribed, and `DELETE` them to unsubscribe, all with authentication.
