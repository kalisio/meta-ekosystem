# {{ name }}

_{{ description }}_

---
{{#if documentation}}

## Documentation

Refer to the [documentation]({{ monorepoUrl }}/{{ monorepoName }})
{{/if}}

## License

{{#if license}}Licensed under the [MIT license](LICENSE).{{else}}Not licensed. This package is private.{{/if}}

Copyright (c) {{ year }}-present [{{author.name}}]({{author.url}})

[<img src="{{author.logo}}" alt="{{author.name}}" height="96">]({{author.url}})