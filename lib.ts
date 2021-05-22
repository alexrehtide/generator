import * as ts from 'typescript';
const { factory: f } = ts;

export class Field {
  private validatorName: string;

  constructor(public options: FieldOptions) {
    this.options.rules = this.options.rules ?? [];
    this.options.fields = this.options.fields ?? [];

    this.validatorName = this.isCustomValidator
      ? `validate${capitalizeFirstLetter(this.options.name)}`
      : `validate${capitalizeFirstLetter(this.options.type)}`;
  }

  get isCustomValidator(): boolean {
    return !!this.options.rules.length || !this.isBaseType;
  }

  get isBaseType() {
    return [
      'string',
      'number',
      'boolean'
    ].includes(this.options.type)
  }

  callValidator(arg: string) {
    return f.createExpressionStatement(
      f.createCallExpression(
        f.createIdentifier(this.validatorName),
        undefined,
        [f.createIdentifier(arg)]
      )
    );
  }

  defineValidator() {
    if (!this.isCustomValidator) return;

    const blockStatements: ts.Statement[] = [];

    if (this.isBaseType) {
      blockStatements.push(
        f.createExpressionStatement(
          f.createCallExpression(
            f.createIdentifier(`validate${capitalizeFirstLetter(this.options.type)}`),
            undefined,
            [f.createIdentifier('value')]
          )
        )
      )
    }

    for (const rule of this.options.rules) {
      if (typeof rule === 'string') {
        blockStatements.push(
          f.createExpressionStatement(
            f.createCallExpression(
              f.createIdentifier(rule),
              undefined,
              [f.createIdentifier('value')]
            )
          )
        )
      } else {
        const args = [
          f.createIdentifier('value'),
          ...this.parseArgs(rule.args)
        ]

        blockStatements.push(
          f.createExpressionStatement(
            f.createCallExpression(
              f.createIdentifier(rule.name),
              undefined,
              args
            )
          )
        )
      }
    }

    for (const field of this.options.fields) {
      blockStatements.push(field.callValidator(`value.${field.options.name}`));
    }

    return f.createFunctionDeclaration(
      undefined,
      undefined,
      undefined,
      f.createIdentifier(this.validatorName),
      undefined,
      [
        f.createParameterDeclaration(
          undefined,
          undefined,
          undefined,
          f.createIdentifier('value'),
          undefined,
          f.createTypeReferenceNode(
            f.createIdentifier(this.options.type),
            undefined
          ),
          undefined
        )
      ],
      f.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword),
      f.createBlock(
        blockStatements,
        true
      )
    )
  }

  private parseArgs(args: unknown[]) {
    return args.map(arg => {
      if (typeof arg === 'string') {
        return f.createStringLiteral(arg);
      }
      if (typeof arg === 'number') {
        return f.createNumericLiteral(arg);
      }
      return;
    })
    .filter(Boolean)
  }
}

type FieldOptions = {
  name: string,
  type: string,
  rules?: Rule[],
  fields?: Field[],
  optional?: boolean,
  isArray?: boolean
}

type Rule = string | { name: string, args: unknown[] }

function capitalizeFirstLetter(string: string) {
  return string[0].toUpperCase() + string.slice(1);
}
