/* eslint-disable func-names */
/* eslint-disable no-restricted-syntax */
import Joi, { GuidVersions } from "joi";
import { FieldOptions } from "./interfaces/IUtils";

type GenerateAccessToken = {
  resetCode: number;
  resetTokenExpires: Date;
};

const generateResetToken = (): GenerateAccessToken => {
  // Créer un token aléatoire
  const resetCode = Math.floor(100000 + Math.random() * 900000);

  // Créer une date d'expiration pour le token, par exemple 1 heure
  const resetTokenExpires = new Date(Date.now() + 3600000); // 1 heure à partir de maintenant

  return {
    resetCode, // Envoyé à l'utilisateur
    resetTokenExpires, // Stocké dans la base de données
  };
};

type Fields = Record<string, FieldOptions>;
const createJoiSchema = function (fields: Fields): Joi.ObjectSchema {
  const schema: { [key: string]: Joi.Schema } = {};

  for (const [key, value] of Object.entries(fields)) {
    let validator;

    switch (value.type) {
      case "string":
        validator = Joi.string();
        if (value.min) validator = validator.min(value.min);
        if (value.max) validator = validator.max(value.max);
        if (value.email) validator = validator.email();
        if (value.pattern)
          validator = validator.pattern(new RegExp(value.pattern));
        break;

      case "number":
        validator = Joi.number();
        if (value.min) validator = validator.min(value.min);
        if (value.max) validator = validator.max(value.max);
        break;

      case "boolean":
        validator = Joi.boolean();
        break;

      case "uuid":
        validator = Joi.string().guid({ version: value.version || "uuidv4" });
        break;
      case "uri":
        validator = Joi.string().uri();
        break;
      case "array":
        validator = Joi.array();
        if (value.items) {
          const itemValidator = createJoiSchema({ items: value.items }).extract(
            "items",
          );
          validator = validator.items(itemValidator);
        }
        break;

      case "object":
        if (value.properties) {
          validator = createJoiSchema(value.properties);
        }
        break;

      case "match":
        validator = Joi.any()
          .valid(Joi.ref(value.matches || ""))
          .messages({
            "any.only": `${key} ne correspond pas à ${value.matches}`,
          });
        break;

      default:
        throw new Error(`Type de validation inconnu: ${value.type}`);
    }
    if (!validator)
      throw new Error(`Aucun valeur dans validator: ${fields.type}`);

    validator = validator.optional();
    if (value.required) {
      validator = validator.required();
    }
    if (value.allowEmpty) validator = validator.allow("", null);

    if (value.default) {
      validator = validator.default(value.default);
    }
    schema[key] = validator;
  }

  return Joi.object(schema);
};

const makeid = function (length: number) {
  let result = "";
  const characters = "abcdefghijklmnopqrstuvwxyz";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i += 1) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export { makeid, createJoiSchema, generateResetToken };
