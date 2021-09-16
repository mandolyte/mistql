import assert from 'assert';
import { parseOrThrow, parse } from './parser';
import { ASTExpression } from './types';

describe('#parse', () => {
  describe('overall', () => {
    it("fails to parse an empty statement", () => {
      assert.throws(() => parseOrThrow(''));
    })
  });

  describe('literals', () => {
    const lit = (type: any, value: any): ASTExpression => ({
      type: 'literal',
      valueType: type,
      value,
    });

    it('parses numeric literals', () => {
      assert.deepStrictEqual(parseOrThrow('1'), lit('number', 1));
      assert.deepStrictEqual(parseOrThrow('2'), lit('number', 2));
      assert.deepStrictEqual(parseOrThrow('3'), lit('number', 3));
      assert.deepStrictEqual(parseOrThrow('349291'), lit('number', 349291));
    });

    it('parses the null literal', () => {
      assert.deepStrictEqual(parseOrThrow('null'), lit('null', null));
    });

    it('parses string literals', () => {
      assert.deepStrictEqual(parseOrThrow('"hi"'), lit('string', 'hi'));
      assert.deepStrictEqual(parseOrThrow('"there"'), lit('string', 'there'));
      assert.deepStrictEqual(parseOrThrow('"DOC OCK"'), lit('string', 'DOC OCK'));
    });

    it('parses array literals', () => {
      assert.deepStrictEqual(
        parseOrThrow('[1, 2, 3]'),
        lit('array', [lit('number', 1), lit('number', 2), lit('number', 3)]));
      assert.deepStrictEqual(
        parseOrThrow('["sup", "mr"]'),
        lit('array', [lit('string', 'sup'), lit('string', 'mr')]));
    });

    it('parses boolean literals', () => {
      assert.deepStrictEqual(parseOrThrow('true'), lit('boolean', true));
      assert.deepStrictEqual(parseOrThrow('false'), lit('boolean', false));
    });
  });

  describe('references', () => {
    it("parses bare references", () => {
      assert.deepStrictEqual(parseOrThrow('somefn'), { type: 'reference', path: ['somefn'] });
    });

    it("parses the root reference", () => {
      assert.deepStrictEqual(parseOrThrow('@'), { type: 'reference', path: ['@'] });
    });

    it("parses a path based on the root reference ", () => {
      assert.deepStrictEqual(parseOrThrow('@.hello.there'), { type: 'reference', path: ['@', 'hello', 'there'] });
    });

    it("parses a deep series of items", () => {
      assert.deepStrictEqual(
        parseOrThrow('there.is.much.to.learn'),
        { type: 'reference', path: ['there', 'is', 'much', 'to', 'learn'] });
    });
  });

  describe('pipes', () => {
    it("parses a simple pipe", () => {
      assert.deepStrictEqual(parseOrThrow('hello|there'), {
        type: 'pipeline', stages: [
          { type: 'reference', path: ['hello'] },
          { type: 'reference', path: ['there'] }
        ]
      });
    });

    it("parses a pipe with whitespace", () => {
      assert.deepStrictEqual(parseOrThrow('hello | there'), {
        type: 'pipeline', stages: [
          { type: 'reference', path: ['hello'] },
          { type: 'reference', path: ['there'] }
        ]
      });
    });

    it("parses a pipe with a number of stages", () => {
      assert.deepStrictEqual(parseOrThrow('hello | there | hi | whatup'), {
        type: 'pipeline', stages: [
          { type: 'reference', path: ['hello'] },
          { type: 'reference', path: ['there'] },
          { type: 'reference', path: ['hi'] },
          { type: 'reference', path: ['whatup'] }
        ]
      });
    });
  });

  describe('parentheticals', () => {
    it('handles a basic parenthetical statement', () => {
      assert.deepStrictEqual(parseOrThrow('(hello)'),
        { type: 'reference', path: ['hello'] });
    });

    it('errors when parsing an empty parenthetical', () => {
      assert.throws(() => parseOrThrow('()'));
    });

    it("interops with pipes", () => {
      assert.deepStrictEqual(parseOrThrow('hello | (there) | hi | (whatup)'), {
        type: 'pipeline', stages: [
          { type: 'reference', path: ['hello'] },
          { type: 'reference', path: ['there'] },
          { type: 'reference', path: ['hi'] },
          { type: 'reference', path: ['whatup'] }
        ]
      });
    });

    it('handles a heavily nested parenthetical', () => {
      assert.deepStrictEqual(parseOrThrow('((((hello))))'),
        { type: 'reference', path: ['hello'] });
    });

    it("allows nested pipe expressions", () => {
      assert.deepStrictEqual(parseOrThrow('hello | (there | hi) | (whatup)'), {
        type: 'pipeline', stages: [
          { type: 'reference', path: ['hello'] },
          {
            type: "pipeline",
            stages: [
              { type: 'reference', path: ['there'] },
              { type: 'reference', path: ['hi'] },]
          },
          { type: 'reference', path: ['whatup'] }
        ]
      });
    });
  });
  describe('applications', () => {
    it('parses a basic function application', () => {
      assert.deepStrictEqual(parseOrThrow('sup nernd hi'),
        {
          type: 'application', function: {
            type: "reference",
            path: ['sup']
          }, 
          arguments: [{
            type: "reference",
            path: ['nernd']
          },
          {
            type: "reference",
            path: ['hi']
          }]
        });
    });

    it('parses function applications with parentheticals', () => {
      assert.deepStrictEqual(parseOrThrow('(sup) (nernd) (hi)'),
        {
          type: 'application', function: {
            type: "reference",
            path: ['sup']
          }, 
          arguments: [{
            type: "reference",
            path: ['nernd']
          },
          {
            type: "reference",
            path: ['hi']
          }]
        });
    });

    it('doesnt capture over pipes', () => {
      assert.deepStrictEqual(parseOrThrow('sup nernd | hi there'),
        { 
          type:"pipeline", 
          stages: [{
            type: 'application', function: {
              type: "reference",
              path: ['sup']
            }, 
            arguments: [{
              type: "reference",
              path: ['nernd']
            }]
          },
          {
            type: 'application', function: {
              type: "reference",
              path: ['hi']
            }, 
            arguments: [{
              type: "reference",
              path: ['there']
            }]
          }]
        }
      );
    });
  });

  describe('binary expressions', () => {
    it("")
  });
});