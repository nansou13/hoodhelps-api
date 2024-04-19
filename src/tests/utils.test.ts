/* eslint-disable camelcase */
const { describe, it, expect } = require("@jest/globals");
const { makeid, createJoiSchema, generateResetToken } = require("../utils");

describe("Utils.js functions", () => {
  describe("GenerateResetToken", () => {
    it("Le token généré doit être un nombre à 6 chiffres", () => {
      const { resetCode } = generateResetToken();
      expect(resetCode).toEqual(expect.any(Number));
      expect(resetCode.toString().length).toBe(6);
    });

    it("La date d'expiration doit être correctement calculée", () => {
      const { resetTokenExpires } = generateResetToken();
      expect(resetTokenExpires).toBeInstanceOf(Date);
      expect(resetTokenExpires.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe("CreateJoiSchema", () => {
    it("Créer un schéma Joi pour un champ de type string", () => {
      const fields = {
        username: { type: "string", required: true, min: 3, max: 30 },
      };
      const schema = createJoiSchema(fields);
      const { error } = schema.validate({ username: "test" });
      expect(error).toBeFalsy();
    });

    it("Créer un schéma Joi pour un champ de type string with max error", () => {
      const fields = {
        username: { type: "string", required: true, min: 2, max: 3 },
      };
      const schema = createJoiSchema(fields);
      const { error } = schema.validate({ username: "test" });
      expect(error).toBeTruthy();
    });

    it("Créer un schéma Joi pour un champ de type string with min error", () => {
      const fields = {
        username: { type: "string", required: true, min: 2, max: 3 },
      };
      const schema = createJoiSchema(fields);
      const { error } = schema.validate({ username: "t" });
      expect(error).toBeTruthy();
    });

    it("Créer un schéma Joi pour un champ de type string with required error", () => {
      const fields = {
        username: { type: "string", required: true, min: 2, max: 3 },
      };
      const schema = createJoiSchema(fields);
      const { error } = schema.validate({});
      expect(error).toBeTruthy();
    });

    it("Créer un schéma Joi pour un champ de type number", () => {
      const fields = {
        age: { type: "number", required: true, min: 18, max: 100 },
      };
      const schema = createJoiSchema(fields);
      const { error } = schema.validate({ age: 25 });
      expect(error).toBeFalsy();
    });

    it("Créer un schéma Joi pour un champ de type number with min error", () => {
      const fields = {
        age: { type: "number", required: true, min: 18, max: 100 },
      };
      const schema = createJoiSchema(fields);
      const { error } = schema.validate({ age: 17 });
      expect(error).toBeTruthy();
    });

    it("Créer un schéma Joi pour un champ de type number with max error", () => {
      const fields = {
        age: { type: "number", required: true, min: 18, max: 100 },
      };
      const schema = createJoiSchema(fields);
      const { error } = schema.validate({ age: 101 });
      expect(error).toBeTruthy();
    });

    it("Créer un schéma Joi pour un champ de type number with required error", () => {
      const fields = {
        age: { type: "number", required: true, min: 18, max: 100 },
      };
      const schema = createJoiSchema(fields);
      const { error } = schema.validate({ ages: 101 });
      expect(error).toBeTruthy();
    });

    it("Créer un schéma Joi pour un champ de type boolean", () => {
      const fields = {
        isActive: { type: "boolean", required: true },
      };
      const schema = createJoiSchema(fields);
      const { error } = schema.validate({ isActive: true });
      expect(error).toBeFalsy();
    });

    it("Créer un schéma Joi pour un champ de type boolean with require error", () => {
      const fields = {
        isActive: { type: "boolean", required: true },
      };
      const schema = createJoiSchema(fields);
      const { error } = schema.validate({ isActived: true });
      expect(error).toBeTruthy();
    });

    it("Créer un schéma Joi pour un champ de type uuid", () => {
      const fields = {
        userId: { type: "uuid", required: true },
      };
      const schema = createJoiSchema(fields);
      const { error } = schema.validate({
        userId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(error).toBeFalsy();
    });

    it("Créer un schéma Joi pour un champ de type uuid with not uuid value", () => {
      const fields = {
        userId: { type: "uuid", required: true },
      };
      const schema = createJoiSchema(fields);
      const { error } = schema.validate({
        userId: "550e8400-e29b-41d4-a716-44665544000",
      });
      expect(error).toBeTruthy();
    });

    it("Créer un schéma Joi pour un champ de type uuid with require error", () => {
      const fields = {
        userId: { type: "uuid", required: true },
      };
      const schema = createJoiSchema(fields);
      const { error } = schema.validate({
        userIds: "550e8400-e29b-41d4-a716-44665544000",
      });
      expect(error).toBeTruthy();
    });

    it("Créer un schéma Joi pour un champ de type uri", () => {
      const fields = {
        website: { type: "uri", required: true },
      };
      const schema = createJoiSchema(fields);
      const { error } = schema.validate({ website: "https://example.com" });
      expect(error).toBeFalsy();
    });

    it("Créer un schéma Joi pour un champ de type uri with require error", () => {
      const fields = {
        website: { type: "uri", required: true },
      };
      const schema = createJoiSchema(fields);
      const { error } = schema.validate({ websites: "https://example.com" });
      expect(error).toBeTruthy();
    });

    it("Créer un schéma Joi pour un champ de type uri with uri error", () => {
      const fields = {
        website: { type: "uri", required: true },
      };
      const schema = createJoiSchema(fields);
      const { error } = schema.validate({ website: "//example.com" });
      expect(error).toBeTruthy();
    });

    it("Créer un schéma Joi pour un champ de type array", () => {
      const fields = {
        tags: { type: "array", items: { type: "string" }, required: true },
      };
      const schema = createJoiSchema(fields);
      const { error } = schema.validate({ tags: ["javascript", "jest"] });
      expect(error).toBeFalsy();
    });

    it("Créer un schéma Joi pour un champ de type array  with require error", () => {
      const fields = {
        tags: { type: "array", items: { type: "string" }, required: true },
      };
      const schema = createJoiSchema(fields);
      const { error } = schema.validate({ tag: ["javascript", "jest"] });
      expect(error).toBeTruthy();
    });

    it("Créer un schéma Joi pour un champ de type array  with type error", () => {
      const fields = {
        tags: { type: "array", items: { type: "string" }, required: true },
      };
      const schema = createJoiSchema(fields);
      const { error } = schema.validate({ tag: {} });
      expect(error).toBeTruthy();
    });

    it("Créer un schéma Joi pour un champ de type object", () => {
      const fields = {
        address: {
          type: "object",
          properties: {
            street: { type: "string" },
            city: { type: "string" },
            zipCode: { type: "string", pattern: "\\d{5}" },
          },
          required: true,
        },
      };
      const schema = createJoiSchema(fields);
      const { error } = schema.validate({
        address: {
          street: "123 Main St",
          city: "Anytown",
          zipCode: "12345",
        },
      });
      expect(error).toBeFalsy();
    });

    it("Utilisez la valeur par défaut si elle est définie", () => {
      const fields = {
        age: { type: "number", required: false, default: 18 },
      };
      const schema = createJoiSchema(fields);
      const { error, value } = schema.validate({});
      expect(error).toBeFalsy();
      expect(value.age).toBe(18);
    });

    it("Créer un schéma Joi pour un champ de type inconnu", () => {
      const fields = {
        tags: { type: "test", required: true },
      };
      expect(() => createJoiSchema(fields)).toThrowError(
        "Type de validation inconnu: test",
      );
    });
  });

  describe("Test de makeid", () => {
    it("La longueur du résultat doit correspondre à la longueur spécifiée", () => {
      const length = 10;
      const result = makeid(length);
      expect(result.length).toBe(length);
    });
  });
});
