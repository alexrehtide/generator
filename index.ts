import * as ts from 'typescript';
const { factory: f } = ts;

import { Field } from './lib'
const username = new Field({
  name: 'username',
  type: 'string',
  rules: [{
    name: 'minLength',
    args: [3]
  }, {
    name: 'maxLength',
    args: [20]
  }]
})
const password = new Field({
  name: 'password',
  type: 'string',
  rules: [{
    name: 'minLength',
    args: [8]
  }]
})
const user = new Field({
  name: 'user',
  type: 'User',
  fields: [username, password],
})

let statements = [];

statements.push(user.callValidator('inputs.user'))
statements.push(user.defineValidator())
for (const field of user.options.fields) {
  statements.push(field.defineValidator())
}
statements = statements.filter(Boolean)

const sourceFile = f.createSourceFile(
  statements,
  f.createToken(ts.SyntaxKind.EndOfFileToken),
  ts.NodeFlags.None
)

const printer = ts.createPrinter();

console.log(printer.printFile(sourceFile))
