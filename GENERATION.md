---
description: Guarantee model responses strictly conform to your JSON schema for reliable, type-safe data structures.
title: Structured Outputs - GroqDocs
image: https://console.groq.com/og_cloudv5.jpg
---

# Structured Outputs

Guarantee model responses strictly conform to your JSON schema for reliable, type-safe data structures.

## [Introduction](#introduction)

Structured Outputs is a feature that ensures your model responses conform to your provided [JSON Schema](https://json-schema.org/overview/what-is-jsonschema). The feature offers two modes with different guarantees and requirements:

Best-effort ModeStrict Mode

### [Strict Mode (strict: true)](#strict-mode-strict-true)

With `strict: true`, the model uses **constrained decoding** to guarantee that the output will always match your schema exactly. This mode:

* **Never errors or produces invalid JSON** \- The model is constrained at the token level to only generate valid outputs
* **100% schema adherence** \- Every response will perfectly match your JSON Schema
* **Stricter requirements** \- All fields must be `required` and objects must set `additionalProperties: false`
* **Limited model support** \- Currently only available on select models (see [Supported Models](#supported-models)) - we're working on adding more models in the future. If you run into 400 errors, we'd appreciate repros posted to our [developer forum](https://community.groq.com/).

This is the recommended mode when available, as it provides the strongest guarantees for production applications.

**Example usage:**

JSON

```
{
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "schema_name",
      "strict": true,
      "schema": { ... }
    }
  }
}
```

### [Best-effort Mode (strict: false)](#besteffort-mode-strict-false)

With `strict: false` (the default behavior), the model attempts to match your schema but without hard constraints:

* **Valid JSON, but schema adherence not guaranteed** \- May produce valid JSON that does not match your schema (for example, wrong field types or missing/extra fields)
* **Possible errors and malformed output** \- Can sometimes produce malformed JSON syntax or trigger 400 errors due to schema validation failures
* **Fewer requirements** \- More flexible schema constraints, such as optional fields
* **Broader model support** \- Available on [all models that support Structured Outputs](#supported-models)

This mode is suitable when you need structured outputs but can handle occasional validation errors with retry logic.

**Example usage:**

JSON

```
{
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "schema_name",
      "strict": false,  // or omit this field (defaults to false)
      "schema": { ... }
    }
  }
}
```

Not sure which mode to use? See [Choosing Between Strict and Best-effort Mode](#choosing-between-strict-and-besteffort-mode) for a detailed comparison.

**Key benefits of Structured Outputs:**

1. **Type-safe responses:** Reduce validation and retry logic for malformed outputs
2. **Programmatic refusal detection:** Detect safety-based model refusals programmatically
3. **Simplified prompting:** Less complex prompts needed for consistent formatting
  
In addition to supporting Structured Outputs in our API, our SDKs also enable you to easily define your schemas with [Pydantic](https://docs.pydantic.dev/latest/) and [Zod](https://zod.dev/) to ensure further type safety. The examples below show how to extract structured information from unstructured text.

## [Supported models](#supported-models)

Structured Outputs is available in two modes: `strict: true` (with constrained decoding) and `strict: false` (default, best-effort validation).

Best-effort ModeStrict Mode

### [Models with Strict Mode (strict: true)](#models-with-strict-mode-strict-true)

The following models support `strict: true`, which uses constrained decoding to guarantee schema-compliant output:

| Model ID            | Model                                           |
| ------------------- | ----------------------------------------------- |
| openai/gpt-oss-20b  | [GPT-OSS 20B](https://console.groq.com/docs/model/openai/gpt-oss-20b)   |
| openai/gpt-oss-120b | [GPT-OSS 120B](https://console.groq.com/docs/model/openai/gpt-oss-120b) |

### [Models with Best-effort Mode (strict: false)](#models-with-besteffort-mode-strict-false)

The following models support Structured Outputs with `strict: false` (default), which attempts schema compliance but may occasionally error:

| Model ID                                  | Model                                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------- |
| openai/gpt-oss-20b                        | [GPT-OSS 20B](https://console.groq.com/docs/model/openai/gpt-oss-20b)                          |
| openai/gpt-oss-120b                       | [GPT-OSS 120B](https://console.groq.com/docs/model/openai/gpt-oss-120b)                        |
| openai/gpt-oss-safeguard-20b              | [Safety GPT OSS 20B](https://console.groq.com/docs/model/openai/gpt-oss-safeguard-20b)         |
| meta-llama/llama-4-scout-17b-16e-instruct | [Llama 4 Scout](https://console.groq.com/docs/model/meta-llama/llama-4-scout-17b-16e-instruct) |

  
For all other models, you can use [JSON Object Mode](#json-object-mode) to get a valid JSON object, though it may not match your schema.

[Streaming](https://console.groq.com/docs/text-chat#streaming-a-chat-completion) and [tool use](https://console.groq.com/docs/tool-use) are not currently supported with Structured Outputs.

### [Getting a structured response from unstructured text](#getting-a-structured-response-from-unstructured-text)

Python

```
import Groq from "groq-sdk";

const groq = new Groq();

const response = await groq.chat.completions.create({
  model: "openai/gpt-oss-20b",
  messages: [
    { role: "system", content: "Extract product review information from the text." },
    {
      role: "user",
      content: "I bought the UltraSound Headphones last week and I'm really impressed! The noise cancellation is amazing and the battery lasts all day. Sound quality is crisp and clear. I'd give it 4.5 out of 5 stars.",
    },
  ],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "product_review",
      strict: true,
      schema: {
        type: "object",
        properties: {
          product_name: { type: "string" },
          rating: { type: "number" },
          sentiment: { 
            type: "string",
            enum: ["positive", "negative", "neutral"]
          },
          key_features: { 
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["product_name", "rating", "sentiment", "key_features"],
        additionalProperties: false
      }
    }
  }
});

const result = JSON.parse(response.choices[0].message.content || "{}");
console.log(result);
```

```
from groq import Groq
import json

groq = Groq()

response = groq.chat.completions.create(
    model="openai/gpt-oss-20b",
    messages=[
        {"role": "system", "content": "Extract product review information from the text."},
        {
            "role": "user",
            "content": "I bought the UltraSound Headphones last week and I'm really impressed! The noise cancellation is amazing and the battery lasts all day. Sound quality is crisp and clear. I'd give it 4.5 out of 5 stars.",
        },
    ],
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "product_review",
            "strict": True,
            "schema": {
                "type": "object",
                "properties": {
                    "product_name": {"type": "string"},
                    "rating": {"type": "number"},
                    "sentiment": {
                        "type": "string",
                        "enum": ["positive", "negative", "neutral"]
                    },
                    "key_features": {
                        "type": "array",
                        "items": {"type": "string"}
                    }
                },
                "required": ["product_name", "rating", "sentiment", "key_features"],
                "additionalProperties": False
            }
        }
    }
)

result = json.loads(response.choices[0].message.content or "{}")
print(json.dumps(result, indent=2))
```

```
curl https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-oss-20b",
    "messages": [
      {
        "role": "system",
        "content": "Extract product review information from the text."
      },
      {
        "role": "user",
        "content": "I bought the UltraSound Headphones last week and I'\''m really impressed! The noise cancellation is amazing and the battery lasts all day. Sound quality is crisp and clear. I'\''d give it 4.5 out of 5 stars."
      }
    ],
    "response_format": {
      "type": "json_schema",
      "json_schema": {
        "name": "product_review",
        "strict": true,
        "schema": {
          "type": "object",
          "properties": {
            "product_name": { "type": "string" },
            "rating": { "type": "number" },
            "sentiment": { 
              "type": "string",
              "enum": ["positive", "negative", "neutral"]
            },
            "key_features": { 
              "type": "array",
              "items": { "type": "string" }
            }
          },
          "required": ["product_name", "rating", "sentiment", "key_features"],
          "additionalProperties": false
        }
      }
    }
  }'
```

Example Output

JSON

```
{
  product_name: 'UltraSound Headphones',
  rating: 4.5,
  sentiment: 'positive',
  key_features: [
    'amazing noise cancellation',
    'all-day battery life',
    'crisp and clear sound quality'
  ]
}
```

### [Choosing Between Strict and Best-effort Mode](#choosing-between-strict-and-besteffort-mode)

| Strict Mode (strict: true) | Best-effort Mode (strict: false)                                |                                                                                    |
| -------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Schema adherence**       | Guaranteed - uses constrained decoding                          | Best-effort - generally compliant                                                  |
| **Error handling**         | Never produces invalid JSON                                     | May occasionally 400 errors or produce syntactically valid but schema-invalid JSON |
| **Requirements**           | All fields must be requiredadditionalProperties: false required | More flexible constraints allowed                                                  |
| **Model support**          | Limited (GPT-OSS 20B, 120B)                                     | All Structured Outputs models                                                      |
| **When to use**            | Production apps requiring 100% reliability                      | Development, prototyping, or when using unsupported models                         |

**Recommendation:** Use Strict Mode (`strict: true`) when available for production applications. Fall back to Best-effort Mode (`strict: false`) for broader model support or during development.

## [Examples](#examples)

SQL Query GenerationEmail ClassificationAPI Response Validation

### [SQL Query Generation](#sql-query-generation)

You can generate structured SQL queries from natural language descriptions, helping ensure proper syntax and including metadata about the query structure.

  
Python

```
import Groq from "groq-sdk";

const groq = new Groq();

const response = await groq.chat.completions.create({
  model: "openai/gpt-oss-120b",
  messages: [
    {
      role: "system",
      content: "You are a SQL expert. Generate structured SQL queries from natural language descriptions with proper syntax validation and metadata.",
    },
    { role: "user", content: "Find all customers who made orders over $500 in the last 30 days, show their name, email, and total order amount" },
  ],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "sql_query_generation",
      schema: {
        type: "object",
        properties: {
          query: { type: "string" },
          query_type: { 
            type: "string", 
            enum: ["SELECT", "INSERT", "UPDATE", "DELETE", "CREATE", "ALTER", "DROP"] 
          },
          tables_used: {
            type: "array",
            items: { type: "string" }
          },
          estimated_complexity: {
            type: "string",
            enum: ["low", "medium", "high"]
          },
          execution_notes: {
            type: "array",
            items: { type: "string" }
          },
          validation_status: {
            type: "object",
            properties: {
              is_valid: { type: "boolean" },
              syntax_errors: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["is_valid", "syntax_errors"],
            additionalProperties: false
          }
        },
        required: ["query", "query_type", "tables_used", "estimated_complexity", "execution_notes", "validation_status"],
        additionalProperties: false
      }
    }
  }
});

const result = JSON.parse(response.choices[0].message.content || "{}");
console.log(result);
```

```
from groq import Groq
from pydantic import BaseModel
import json

client = Groq()

class ValidationStatus(BaseModel):
    is_valid: bool
    syntax_errors: list[str]

class SQLQueryGeneration(BaseModel):
    query: str
    query_type: str
    tables_used: list[str]
    estimated_complexity: str
    execution_notes: list[str]
    validation_status: ValidationStatus

response = client.chat.completions.create(
    model="openai/gpt-oss-120b",
    messages=[
        {
            "role": "system",
            "content": "You are a SQL expert. Generate structured SQL queries from natural language descriptions with proper syntax validation and metadata.",
        },
        {"role": "user", "content": "Find all customers who made orders over $500 in the last 30 days, show their name, email, and total order amount"},
    ],
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "sql_query_generation",
            "schema": SQLQueryGeneration.model_json_schema()
        }
    }
)

sql_query_generation = SQLQueryGeneration.model_validate(json.loads(response.choices[0].message.content))
print(json.dumps(sql_query_generation.model_dump(), indent=2))
```

```
curl https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-oss-120b",
    "messages": [
      {
        "role": "system",
        "content": "You are a SQL expert. Generate structured SQL queries from natural language descriptions with proper syntax validation and metadata."
      },
      {
        "role": "user",
        "content": "Find all customers who made orders over $500 in the last 30 days, show their name, email, and total order amount"
      }
    ],
    "response_format": {
      "type": "json_schema",
      "json_schema": {
        "name": "sql_query_generation",
        "schema": {
          "type": "object",
          "properties": {
            "query": { "type": "string" },
            "query_type": { 
              "type": "string", 
              "enum": ["SELECT", "INSERT", "UPDATE", "DELETE", "CREATE", "ALTER", "DROP"] 
            },
            "tables_used": {
              "type": "array",
              "items": { "type": "string" }
            },
            "estimated_complexity": {
              "type": "string",
              "enum": ["low", "medium", "high"]
            },
            "execution_notes": {
              "type": "array",
              "items": { "type": "string" }
            },
            "validation_status": {
              "type": "object",
              "properties": {
                "is_valid": { "type": "boolean" },
                "syntax_errors": {
                  "type": "array",
                  "items": { "type": "string" }
                }
              },
              "required": ["is_valid", "syntax_errors"],
              "additionalProperties": false
            }
          },
          "required": ["query", "query_type", "tables_used", "estimated_complexity", "execution_notes", "validation_status"],
          "additionalProperties": false
        }
      }
    }
  }'
```

Example Output

JSON

```
{
  "query": "SELECT c.name, c.email, SUM(o.total_amount) as total_order_amount FROM customers c JOIN orders o ON c.customer_id = o.customer_id WHERE o.order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND o.total_amount > 500 GROUP BY c.customer_id, c.name, c.email ORDER BY total_order_amount DESC",
  "query_type": "SELECT",
  "tables_used": ["customers", "orders"],
  "estimated_complexity": "medium",
  "execution_notes": [
    "Query uses JOIN to connect customers and orders tables",
    "DATE_SUB function calculates 30 days ago from current date",
    "GROUP BY aggregates orders per customer",
    "Results ordered by total order amount descending"
  ],
  "validation_status": {
    "is_valid": true,
    "syntax_errors": []
  }
}
```

### [Email Classification](#email-classification)

You can classify emails into structured categories with confidence scores, priority levels, and suggested actions.

  
Python

```
import Groq from "groq-sdk";

const groq = new Groq();

const response = await groq.chat.completions.create({
  model: "openai/gpt-oss-120b",
  messages: [
    {
      role: "system",
      content: "You are an email classification expert. Classify emails into structured categories with confidence scores, priority levels, and suggested actions.",
    },
    { role: "user", content: "Subject: URGENT: Server downtime affecting production\n\nHi Team,\n\nOur main production server went down at 2:30 PM EST. Customer-facing services are currently unavailable. We need immediate action to restore services. Please join the emergency call.\n\nBest regards,\nDevOps Team" },
  ],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "email_classification",
      schema: {
        type: "object",
        properties: {
          category: { 
            type: "string", 
            enum: ["urgent", "support", "sales", "marketing", "internal", "spam", "notification"] 
          },
          priority: { 
            type: "string", 
            enum: ["low", "medium", "high", "critical"] 
          },
          confidence_score: { 
            type: "number", 
            minimum: 0, 
            maximum: 1 
          },
          sentiment: { 
            type: "string", 
            enum: ["positive", "negative", "neutral"] 
          },
          key_entities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                entity: { type: "string" },
                type: { 
                  type: "string", 
                  enum: ["person", "organization", "location", "datetime", "system", "product"] 
                }
              },
              required: ["entity", "type"],
              additionalProperties: false
            }
          },
          suggested_actions: {
            type: "array",
            items: { type: "string" }
          },
          requires_immediate_attention: { type: "boolean" },
          estimated_response_time: { type: "string" }
        },
        required: ["category", "priority", "confidence_score", "sentiment", "key_entities", "suggested_actions", "requires_immediate_attention", "estimated_response_time"],
        additionalProperties: false
      }
    }
  }
});

const result = JSON.parse(response.choices[0].message.content || "{}");
console.log(result);
```

```
from groq import Groq
from pydantic import BaseModel
import json

client = Groq()

class KeyEntity(BaseModel):
    entity: str
    type: str

class EmailClassification(BaseModel):
    category: str
    priority: str
    confidence_score: float
    sentiment: str
    key_entities: list[KeyEntity]
    suggested_actions: list[str]
    requires_immediate_attention: bool
    estimated_response_time: str

response = client.chat.completions.create(
    model="openai/gpt-oss-120b",
    messages=[
        {
            "role": "system",
            "content": "You are an email classification expert. Classify emails into structured categories with confidence scores, priority levels, and suggested actions.",
        },
        {"role": "user", "content": "Subject: URGENT: Server downtime affecting production\\n\\nHi Team,\\n\\nOur main production server went down at 2:30 PM EST. Customer-facing services are currently unavailable. We need immediate action to restore services. Please join the emergency call.\\n\\nBest regards,\\nDevOps Team"},
    ],
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "email_classification",
            "schema": EmailClassification.model_json_schema()
        }
    }
)

email_classification = EmailClassification.model_validate(json.loads(response.choices[0].message.content))
print(json.dumps(email_classification.model_dump(), indent=2))
```

```
curl https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-oss-120b",
    "messages": [
      {
        "role": "system",
        "content": "You are an email classification expert. Classify emails into structured categories with confidence scores, priority levels, and suggested actions."
      },
      {
        "role": "user",
        "content": "Subject: URGENT: Server downtime affecting production\n\nHi Team,\n\nOur main production server went down at 2:30 PM EST. Customer-facing services are currently unavailable. We need immediate action to restore services. Please join the emergency call.\n\nBest regards,\nDevOps Team"
      }
    ],
    "response_format": {
      "type": "json_schema",
      "json_schema": {
        "name": "email_classification",
        "schema": {
          "type": "object",
          "properties": {
            "category": { 
              "type": "string", 
              "enum": ["urgent", "support", "sales", "marketing", "internal", "spam", "notification"] 
            },
            "priority": { 
              "type": "string", 
              "enum": ["low", "medium", "high", "critical"] 
            },
            "confidence_score": { 
              "type": "number", 
              "minimum": 0, 
              "maximum": 1 
            },
            "sentiment": { 
              "type": "string", 
              "enum": ["positive", "negative", "neutral"] 
            },
            "key_entities": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "entity": { "type": "string" },
                  "type": { 
                    "type": "string", 
                    "enum": ["person", "organization", "location", "datetime", "system", "product"] 
                  }
                },
                "required": ["entity", "type"],
                "additionalProperties": false
              }
            },
            "suggested_actions": {
              "type": "array",
              "items": { "type": "string" }
            },
            "requires_immediate_attention": { "type": "boolean" },
            "estimated_response_time": { "type": "string" }
          },
          "required": ["category", "priority", "confidence_score", "sentiment", "key_entities", "suggested_actions", "requires_immediate_attention", "estimated_response_time"],
          "additionalProperties": false
        }
      }
    }
  }'
```

Example Output

JSON

```
{
  "category": "urgent",
  "priority": "critical",
  "confidence_score": 0.95,
  "sentiment": "negative",
  "key_entities": [
      {
        "entity": "production server",
        "type": "system"
      },
      {
        "entity": "2:30 PM EST",
        "type": "datetime"
      },
      {
        "entity": "DevOps Team",
        "type": "organization"
      },
      {
        "entity": "customer-facing services",
        "type": "system"
      }
  ],
  "suggested_actions": [
      "Join emergency call immediately",
      "Escalate to senior DevOps team",
      "Activate incident response protocol",
      "Prepare customer communication",
      "Monitor service restoration progress"
  ],
  "requires_immediate_attention": true,
  "estimated_response_time": "immediate"
}
```

### [API Response Validation](#api-response-validation)

You can validate and structure API responses with error handling, status codes, and standardized data formats for reliable integration.

  
Python

```
import Groq from "groq-sdk";

const groq = new Groq();

const response = await groq.chat.completions.create({
  model: "openai/gpt-oss-120b",
  messages: [
    {
      role: "system",
      content: "You are an API response validation expert. Validate and structure API responses with error handling, status codes, and standardized data formats for reliable integration.",
    },
    { role: "user", content: "Validate this API response: {\"user_id\": \"12345\", \"email\": \"invalid-email\", \"created_at\": \"2024-01-15T10:30:00Z\", \"status\": \"active\", \"profile\": {\"name\": \"John Doe\", \"age\": 25}}" },
  ],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "api_response_validation",
      schema: {
        type: "object",
        properties: {
          validation_result: {
            type: "object",
            properties: {
              is_valid: { type: "boolean" },
              status_code: { type: "integer" },
              error_count: { type: "integer" }
            },
            required: ["is_valid", "status_code", "error_count"],
            additionalProperties: false
          },
          field_validations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field_name: { type: "string" },
                field_type: { type: "string" },
                is_valid: { type: "boolean" },
                error_message: { type: "string" },
                expected_format: { type: "string" }
              },
              required: ["field_name", "field_type", "is_valid", "error_message", "expected_format"],
              additionalProperties: false
            }
          },
          data_quality_score: { 
            type: "number", 
            minimum: 0, 
            maximum: 1 
          },
          suggested_fixes: {
            type: "array",
            items: { type: "string" }
          },
          compliance_check: {
            type: "object",
            properties: {
              follows_rest_standards: { type: "boolean" },
              has_proper_error_handling: { type: "boolean" },
              includes_metadata: { type: "boolean" }
            },
            required: ["follows_rest_standards", "has_proper_error_handling", "includes_metadata"],
            additionalProperties: false
          },
          standardized_response: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object" },
              errors: {
                type: "array",
                items: { type: "string" }
              },
              metadata: {
                type: "object",
                properties: {
                  timestamp: { type: "string" },
                  request_id: { type: "string" },
                  version: { type: "string" }
                },
                required: ["timestamp", "request_id", "version"],
                additionalProperties: false
              }
            },
            required: ["success", "data", "errors", "metadata"],
            additionalProperties: false
          }
        },
        required: ["validation_result", "field_validations", "data_quality_score", "suggested_fixes", "compliance_check", "standardized_response"],
        additionalProperties: false
      }
    }
  }
});

const result = JSON.parse(response.choices[0].message.content || "{}");
console.log(result);
```

```
from groq import Groq
from pydantic import BaseModel
import json

client = Groq()

class ValidationResult(BaseModel):
    is_valid: bool
    status_code: int
    error_count: int

class FieldValidation(BaseModel):
    field_name: str
    field_type: str
    is_valid: bool
    error_message: str
    expected_format: str

class ComplianceCheck(BaseModel):
    follows_rest_standards: bool
    has_proper_error_handling: bool
    includes_metadata: bool

class Metadata(BaseModel):
    timestamp: str
    request_id: str
    version: str

class StandardizedResponse(BaseModel):
    success: bool
    data: dict
    errors: list[str]
    metadata: Metadata

class APIResponseValidation(BaseModel):
    validation_result: ValidationResult
    field_validations: list[FieldValidation]
    data_quality_score: float
    suggested_fixes: list[str]
    compliance_check: ComplianceCheck
    standardized_response: StandardizedResponse

response = client.chat.completions.create(
    model="openai/gpt-oss-120b",
    messages=[
        {
            "role": "system",
            "content": "You are an API response validation expert. Validate and structure API responses with error handling, status codes, and standardized data formats for reliable integration.",
        },
        {"role": "user", "content": "Validate this API response: {\"user_id\": \"12345\", \"email\": \"invalid-email\", \"created_at\": \"2024-01-15T10:30:00Z\", \"status\": \"active\", \"profile\": {\"name\": \"John Doe\", \"age\": 25}}"},
    ],
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "api_response_validation",
            "schema": APIResponseValidation.model_json_schema()
        }
    }
)

api_response_validation = APIResponseValidation.model_validate(json.loads(response.choices[0].message.content))
print(json.dumps(api_response_validation.model_dump(), indent=2))
```

```
curl https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-oss-120b",
    "messages": [
      {
        "role": "system",
        "content": "You are an API response validation expert. Validate and structure API responses with error handling, status codes, and standardized data formats for reliable integration."
      },
      {
        "role": "user",
        "content": "Validate this API response: {\"user_id\": \"12345\", \"email\": \"invalid-email\", \"created_at\": \"2024-01-15T10:30:00Z\", \"status\": \"active\", \"profile\": {\"name\": \"John Doe\", \"age\": 25}}"
      }
    ],
    "response_format": {
      "type": "json_schema",
      "json_schema": {
        "name": "api_response_validation",
        "schema": {
          "type": "object",
          "properties": {
            "validation_result": {
              "type": "object",
              "properties": {
                "is_valid": { "type": "boolean" },
                "status_code": { "type": "integer" },
                "error_count": { "type": "integer" }
              },
              "required": ["is_valid", "status_code", "error_count"],
              "additionalProperties": false
            },
            "field_validations": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "field_name": { "type": "string" },
                  "field_type": { "type": "string" },
                  "is_valid": { "type": "boolean" },
                  "error_message": { "type": "string" },
                  "expected_format": { "type": "string" }
                },
                "required": ["field_name", "field_type", "is_valid", "error_message", "expected_format"],
                "additionalProperties": false
              }
            },
            "data_quality_score": { 
              "type": "number", 
              "minimum": 0, 
              "maximum": 1 
            },
            "suggested_fixes": {
              "type": "array",
              "items": { "type": "string" }
            },
            "compliance_check": {
              "type": "object",
              "properties": {
                "follows_rest_standards": { "type": "boolean" },
                "has_proper_error_handling": { "type": "boolean" },
                "includes_metadata": { "type": "boolean" }
              },
              "required": ["follows_rest_standards", "has_proper_error_handling", "includes_metadata"],
              "additionalProperties": false
            },
            "standardized_response": {
              "type": "object",
              "properties": {
                "success": { "type": "boolean" },
                "data": { "type": "object" },
                "errors": {
                  "type": "array",
                  "items": { "type": "string" }
                },
                "metadata": {
                  "type": "object",
                  "properties": {
                    "timestamp": { "type": "string" },
                    "request_id": { "type": "string" },
                    "version": { "type": "string" }
                  },
                  "required": ["timestamp", "request_id", "version"],
                  "additionalProperties": false
                }
              },
              "required": ["success", "data", "errors", "metadata"],
              "additionalProperties": false
            }
          },
          "required": ["validation_result", "field_validations", "data_quality_score", "suggested_fixes", "compliance_check", "standardized_response"],
          "additionalProperties": false
        }
      }
    }
  }'
```

Example Output

JSON

```
{
  "validation_result": {
      "is_valid": false,
      "status_code": 400,
      "error_count": 2
  },
  "field_validations": [
      {
          "field_name": "user_id",
          "field_type": "string",
          "is_valid": true,
          "error_message": "",
          "expected_format": "string"
      },
      {
          "field_name": "email",
          "field_type": "string",
          "is_valid": false,
          "error_message": "Invalid email format",
          "expected_format": "valid email address (e.g., [email protected])"
      }
  ],
  "data_quality_score": 0.7,
  "suggested_fixes": [
      "Fix email format validation to ensure proper email structure",
      "Add proper error handling structure to response"
  ],
  "compliance_check": {
      "follows_rest_standards": false,
      "has_proper_error_handling": false,
      "includes_metadata": false
  }
}
```

## [Schema Validation Libraries](#schema-validation-libraries)

When working with Structured Outputs, you can use popular schema validation libraries like [Zod](https://zod.dev/) for TypeScript and [Pydantic](https://docs.pydantic.dev/latest/) for Python. These libraries provide type safety, runtime validation, and seamless integration with JSON Schema generation.

### [Support Ticket Classification](#support-ticket-classification)

This example demonstrates how to classify customer support tickets using structured schemas with both Zod and Pydantic, ensuring consistent categorization and routing.

Zod (TypeScript)Pydantic (Python)

TypeScript

```
import Groq from "groq-sdk";
import { z } from "zod";

const groq = new Groq();

const supportTicketSchema = z.object({
  category: z.enum(["api", "billing", "account", "bug", "feature_request", "integration", "security", "performance"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  urgency_score: z.number(),
  customer_info: z.object({
    name: z.string(),
    company: z.string().optional(),
    tier: z.enum(["free", "paid", "enterprise", "trial"])
  }),
  technical_details: z.array(z.object({
    component: z.string(),
    error_code: z.string().optional(),
    description: z.string()
  })),
  keywords: z.array(z.string()),
  requires_escalation: z.boolean(),
  estimated_resolution_hours: z.number(),
  follow_up_date: z.string().datetime().optional(),
  summary: z.string()
});

type SupportTicket = z.infer<typeof supportTicketSchema>;

const response = await groq.chat.completions.create({
  model: "openai/gpt-oss-120b",
  messages: [
    {
      role: "system",
      content: `You are a customer support ticket classifier for SaaS companies. 
                Analyze support tickets and categorize them for efficient routing and resolution.
                Output JSON only using the schema provided.`,
    },
    { 
      role: "user", 
      content: `Hello! I love your product and have been using it for 6 months. 
                I was wondering if you could add a dark mode feature to the dashboard? 
                Many of our team members work late hours and would really appreciate this. 
                Also, it would be great to have keyboard shortcuts for common actions. 
                Not urgent, but would be a nice enhancement! 
                Best, Mike from StartupXYZ`
    },
  ],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "support_ticket_classification",
      schema: z.toJSONSchema(supportTicketSchema)
    }
  }
});

const rawResult = JSON.parse(response.choices[0].message.content || "{}");
const result = supportTicketSchema.parse(rawResult);
console.log(result);
```

Python

```
from groq import Groq
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from enum import Enum
import json

client = Groq()

class SupportCategory(str, Enum):
    API = "api"
    BILLING = "billing"
    ACCOUNT = "account"
    BUG = "bug"
    FEATURE_REQUEST = "feature_request"
    INTEGRATION = "integration"
    SECURITY = "security"
    PERFORMANCE = "performance"

class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class CustomerTier(str, Enum):
    FREE = "free"
    PAID = "paid"
    ENTERPRISE = "enterprise"
    TRIAL = "trial"

class CustomerInfo(BaseModel):
    name: str
    company: Optional[str] = None
    tier: CustomerTier

class TechnicalDetail(BaseModel):
    component: str
    error_code: Optional[str] = None
    description: str

class SupportTicket(BaseModel):
    category: SupportCategory
    priority: Priority
    urgency_score: float
    customer_info: CustomerInfo
    technical_details: List[TechnicalDetail]
    keywords: List[str]
    requires_escalation: bool
    estimated_resolution_hours: float
    follow_up_date: Optional[str] = Field(None, description="ISO datetime string")
    summary: str

response = client.chat.completions.create(
    model="openai/gpt-oss-120b",
    messages=[
        {
            "role": "system",
            "content": """You are a customer support ticket classifier for SaaS companies. 
                         Analyze support tickets and categorize them for efficient routing and resolution.
                         Output JSON only using the schema provided.""",
        },
        { 
            "role": "user", 
            "content": """Hello! I love your product and have been using it for 6 months. 
                         I was wondering if you could add a dark mode feature to the dashboard? 
                         Many of our team members work late hours and would really appreciate this. 
                         Also, it would be great to have keyboard shortcuts for common actions. 
                         Not urgent, but would be a nice enhancement! 
                         Best, Mike from StartupXYZ"""
        },
    ],
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "support_ticket_classification",
            "schema": SupportTicket.model_json_schema()
        }
    }
)

raw_result = json.loads(response.choices[0].message.content or "{}")
result = SupportTicket.model_validate(raw_result)
print(result.model_dump_json(indent=2))
```

Example Output

JSON

```
{
  "category": "feature_request",
  "priority": "low",
  "urgency_score": 2.5,
  "customer_info": {
      "name": "Mike",
      "company": "StartupXYZ",
      "tier": "paid"
  },
  "technical_details": [
      {
          "component": "dashboard",
          "description": "Request for dark mode feature"
      },
      {
          "component": "user_interface",
          "description": "Request for keyboard shortcuts"
      }
  ],
  "keywords": ["dark mode", "dashboard", "keyboard shortcuts", "enhancement"],
  "requires_escalation": false,
  "estimated_resolution_hours": 40,
  "summary": "Feature request for dark mode and keyboard shortcuts from paying customer"
}
```

## [Implementation Guide](#implementation-guide)

### [Schema Definition](#schema-definition)

Design your JSON Schema to constrain model responses. Reference the [examples](#examples) above and see [supported schema features](#schema-requirements) for technical limitations.

### [API Integration](#api-integration)

Include the schema in your API request using the `response_format` parameter. Choose between `strict: true` for guaranteed schema compliance or `strict: false` for best-effort validation:

Strict ModeBest-effort Mode

**Using Strict Mode (`strict: true`)**

Set `strict: true` for guaranteed schema compliance on supported models:

JSON

```
response_format: { type: "json_schema", json_schema: { name: "schema_name", strict: true, schema: … } }
```

  
Complete implementation example:

Python

```
from groq import Groq
import json

client = Groq()

response = client.chat.completions.create(
    model="openai/gpt-oss-20b",
    messages=[
        {"role": "system", "content": "You are a helpful math tutor. Guide the user through the solution step by step."},
        {"role": "user", "content": "how can I solve 8x + 7 = -23"}
    ],
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "math_response",
            "strict": True,
            "schema": {
                "type": "object",
                "properties": {
                    "steps": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "explanation": {"type": "string"},
                                "output": {"type": "string"}
                            },
                            "required": ["explanation", "output"],
                            "additionalProperties": False
                        }
                    },
                    "final_answer": {"type": "string"}
                },
                "required": ["steps", "final_answer"],
                "additionalProperties": False
            }
        }
    }
)

result = json.loads(response.choices[0].message.content)
print(json.dumps(result, indent=2))
```

```
import Groq from "groq-sdk";

const groq = new Groq();

const response = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: [
        { role: "system", content: "You are a helpful math tutor. Guide the user through the solution step by step." },
        { role: "user", content: "how can I solve 8x + 7 = -23" }
    ],
    response_format: {
        type: "json_schema",
        json_schema: {
            name: "math_response",
            strict: true,
            schema: {
                type: "object",
                properties: {
                    steps: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                explanation: { type: "string" },
                                output: { type: "string" }
                            },
                            required: ["explanation", "output"],
                            additionalProperties: false
                        }
                    },
                    final_answer: { type: "string" }
                },
                required: ["steps", "final_answer"],
                additionalProperties: false
            }
        }
    }
});

const result = JSON.parse(response.choices[0].message.content || "{}");
console.log(result);
```

```
curl https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-oss-20b",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful math tutor. Guide the user through the solution step by step."
      },
      {
        "role": "user",
        "content": "how can I solve 8x + 7 = -23"
      }
    ],
    "response_format": {
      "type": "json_schema",
      "json_schema": {
        "name": "math_response",
        "strict": true,
        "schema": {
          "type": "object",
          "properties": {
            "steps": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "explanation": { "type": "string" },
                  "output": { "type": "string" }
                },
                "required": ["explanation", "output"],
                "additionalProperties": false
              }
            },
            "final_answer": { "type": "string" }
          },
          "required": ["steps", "final_answer"],
          "additionalProperties": false
        }
      }
    }
  }'
```

**Using Best-effort Mode (`strict: false`)**

Set `strict: false` or omit the parameter for best-effort validation:

JSON

```
response_format: { type: "json_schema", json_schema: { name: "schema_name", strict: false, schema: … } }
```

  
Complete implementation example:

curlcurlcurl

### [Error Handling](#error-handling)

Error handling differs based on which mode you're using:

Strict ModeBest-effort Mode

**With Strict Mode (`strict: true`)**

Constrained decoding guarantees schema-compliant output, so you won't encounter schema validation errors. The model's output will always match your JSON Schema perfectly.

**No error handling needed:**

Python

```
# Simple and reliable - no try/catch needed for validation
response = client.chat.completions.create(
    model="openai/gpt-oss-20b",
    messages=[...],
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "schema_name",
            "strict": True,
            "schema": {...}
        }
    }
)

# Output is guaranteed to match schema
data = json.loads(response.choices[0].message.content)
```

**With Best-effort Mode (`strict: false`)**

Schema validation failures may occur and return HTTP 400 errors with the message `Generated JSON does not match the expected schema. Please adjust your prompt.`

  
**Resolution strategies:**

* Retry requests for transient failures
* Refine prompts for recurring schema mismatches
* Simplify complex schemas if validation consistently fails
* Consider migrating to `strict: true` for guaranteed compliance

**Example with retry logic:**

Python

```
# Recommended pattern for strict: false
max_retries = 3
for attempt in range(max_retries):
    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[...],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "schema_name",
                    "strict": False,
                    "schema": {...}
                }
            }
        )
        data = json.loads(response.choices[0].message.content)
        validate_schema(data)  # Manual validation
        break
    except ValidationError as e:
        if attempt == max_retries - 1:
            raise
        # Retry on validation failure
```

### [Best Practices](#best-practices)

* **User input handling:** Include explicit instructions for invalid or incompatible inputs. Models attempt schema adherence even with unrelated data, potentially causing hallucinations. Specify fallback responses (empty fields, error messages) for incompatible inputs.
* **Output quality:** Structured outputs are designed to output schema compliance but not semantic accuracy. For persistent errors, refine instructions, add system message examples, or decompose complex tasks. See the [prompt engineering guide](https://console.groq.com/docs/prompting) for optimization techniques.

## [Migration Guide: Upgrading to Strict Mode](#migration-guide-upgrading-to-strict-mode)

If you're currently using Structured Outputs with `strict: false` (or without specifying the `strict` parameter), you can upgrade to `strict: true` for guaranteed schema compliance. Follow these steps:

### [Step 1: Verify Model Support](#step-1-verify-model-support)

Ensure you're using a model that supports `strict: true`. See the [Supported Models](#supported-models) section for more information.

### [Step 2: Update Your Schema](#step-2-update-your-schema)

Make your schema compliant with `strict: true` requirements:

**Mark all fields as required:**

JSON

```
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "number" }
  },
  "required": ["name", "age"]  // ← Ensure all properties are in required array
}
```

**Add `additionalProperties: false` to all objects:**

JSON

```
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "email": { "type": "string" }
  },
  "required": ["name", "email"],
  "additionalProperties": false  // ← Add this to all objects
}
```

**Handle optional fields with union types:**

If you need optional fields, use union types with `null`:

JSON

```
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "nickname": { 
      "type": ["string", "null"]  // ← Use union type for optional fields
    }
  },
  "required": ["name", "nickname"],  // ← Field must still be in required array
  "additionalProperties": false
}
```

### [Step 3: Update API Calls](#step-3-update-api-calls)

Add `strict: true` to your `response_format`:

JSON

```
{
  "model": "openai/gpt-oss-20b",
  "messages": [...],
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "schema_name",
      "strict": true,  // ← Add this line
      "schema": {...}
    }
  }
}
```

## [Schema Requirements](#schema-requirements)

Structured Outputs supports a [JSON Schema](https://json-schema.org/docs) subset with specific constraints for performance and reliability.

### [Supported Data Types](#supported-data-types)

* **Primitives:** String, Number, Boolean, Integer
* **Complex:** Object, Array, Enum
* **Composition:** anyOf (union types)

### [Schema Constraints by Mode](#schema-constraints-by-mode)

Best-effort ModeStrict Mode

When using `strict: true`, your schema **must** follow these mandatory constraints:

**Required fields:** All schema properties must be marked as `required`. Optional fields are not supported.

JSON

```
{
  "name": "create_task",
  "description": "Creates a new task in the project management system",
  "strict": true,
  "parameters": {
    "type": "object",
    "properties": {
      "title": {
        "type": "string",
        "description": "The task title or summary"
      },
      "priority": {
        "type": "string",
        "description": "Task priority level",
        "enum": ["low", "medium", "high", "urgent"]
      }
    },
    "additionalProperties": false,
    "required": ["title", "priority"]
  }
}
```

  
**Closed objects:** All objects must set `additionalProperties: false` to prevent undefined properties. This ensures strict schema adherence.

  
**Handling optional fields:** Use union types with `null` to represent optional values:

JSON

```
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "nickname": { 
      "type": ["string", "null"]
    }
  },
  "required": ["name", "nickname"],
  "additionalProperties": false
}
```

When using `strict: false` (default), your schema has more flexibility:

* **Optional fields allowed:** Not all properties need to be in `required`
* **additionalProperties:** Can be `true` or omitted (though `false` is recommended)
* **More forgiving validation:** Best-effort schema matching, but may occasionally produce errors or invalid JSON
  
**Example with optional fields:**

JSON

```
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "nickname": { "type": "string" }
  },
  "required": ["name"]
}
```

**Note:** While `strict: false` is more flexible, following the `strict: true` requirements will improve output quality and reduce validation errors.

  
**Union types:** Each schema within `anyOf` must comply with all subset restrictions:

JSON

```
{
  "type": "object",
  "properties": {
    "payment_method": {
      "anyOf": [
        {
          "type": "object",
          "description": "Credit card payment information",
          "properties": {
            "card_number": {
              "type": "string",
              "description": "The credit card number"
            },
            "expiry_date": {
              "type": "string",
              "description": "Card expiration date in MM/YY format"
            },
            "cvv": {
              "type": "string",
              "description": "Card security code"
            }
          },
          "additionalProperties": false,
          "required": ["card_number", "expiry_date", "cvv"]
        },
        {
          "type": "object",
          "description": "Bank transfer payment information",
          "properties": {
            "account_number": {
              "type": "string",
              "description": "Bank account number"
            },
            "routing_number": {
              "type": "string",
              "description": "Bank routing number"
            },
            "bank_name": {
              "type": "string",
              "description": "Name of the bank"
            }
          },
          "additionalProperties": false,
          "required": ["account_number", "routing_number", "bank_name"]
        }
      ]
    }
  },
  "additionalProperties": false,
  "required": ["payment_method"]
}
```

  
**Reusable subschemas:** Define reusable components with `$defs` and reference them using `$ref`:

JSON

```
{
  "type": "object",
  "properties": {
    "milestones": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/milestone"
      }
    },
    "project_status": {
      "type": "string",
      "enum": ["planning", "in_progress", "completed", "on_hold"]
    }
  },
  "$defs": {
    "milestone": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "description": "Milestone name"
        },
        "deadline": {
          "type": "string",
          "description": "Due date in ISO format"
        },
        "completed": {
          "type": "boolean"
        }
      },
      "required": ["title", "deadline", "completed"],
      "additionalProperties": false
    }
  },
  "required": ["milestones", "project_status"],
  "additionalProperties": false
}
```

  
**Root recursion:** Use `#` to reference the root schema:

JSON

```
{
  "name": "organization_chart",
  "description": "Company organizational structure",
  "strict": true,
  "schema": {
    "type": "object",
    "properties": {
      "employee_id": {
        "type": "string",
        "description": "Unique employee identifier"
      },
      "name": {
        "type": "string",
        "description": "Employee full name"
      },
      "position": {
        "type": "string",
        "description": "Job title or position",
        "enum": ["CEO", "Manager", "Developer", "Designer", "Analyst", "Intern"]
      },
      "direct_reports": {
        "type": "array",
        "description": "Employees reporting to this person",
        "items": {
          "$ref": "#"
        }
      },
      "contact_info": {
        "type": "array",
        "description": "Contact information for the employee",
        "items": {
          "type": "object",
          "properties": {
            "type": {
              "type": "string",
              "description": "Type of contact info",
              "enum": ["email", "phone", "slack"]
            },
            "value": {
              "type": "string",
              "description": "The contact value"
            }
          },
          "additionalProperties": false,
          "required": ["type", "value"]
        }
      }
    },
    "required": [
      "employee_id",
      "name",
      "position",
      "direct_reports",
      "contact_info"
    ],
    "additionalProperties": false
  }
}
```

  
**Explicit recursion** through definition references:

JSON

```
{
  "type": "object",
  "properties": {
    "file_system": {
      "$ref": "#/$defs/file_node"
    }
  },
  "$defs": {
    "file_node": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "description": "File or directory name"
        },
        "type": {
          "type": "string",
          "enum": ["file", "directory"]
        },
        "size": {
          "type": "number",
          "description": "Size in bytes (0 for directories)"
        },
        "children": {
          "anyOf": [
            {
              "type": "array",
              "items": {
                "$ref": "#/$defs/file_node"
              }
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "additionalProperties": false,
      "required": ["name", "type", "size", "children"]
    }
  },
  "additionalProperties": false,
  "required": ["file_system"]
}
```

## [JSON Object Mode](#json-object-mode)

JSON Object Mode provides basic JSON output validation without schema enforcement. Unlike Structured Outputs with `json_schema` mode, it is designed to output valid JSON syntax but not schema compliance. The endpoint will either return valid JSON or throw an error if the model cannot produce valid JSON syntax. Use [Structured Outputs](#introduction) when available for your use case.

| Strict Mode          | Best-effort Mode                     | JSON Object Mode                     |                            |
| -------------------- | ------------------------------------ | ------------------------------------ | -------------------------- |
| **Valid JSON**       | Always ✓                             | Usually ✓                            | Usually ✓                  |
| **Schema adherence** | Guaranteed ✓                         | Best-effort                          | No                         |
| **Can error**        | No                                   | Occasionally                         | Occasionally               |
| **Requires schema**  | Yes                                  | Yes                                  | No                         |
| **Model support**    | [Multiple models](#supported-models) | [Multiple models](#supported-models) | All models                 |
| **Use case**         | Production apps                      | Development, broader compatibility   | Simple JSON without schema |

  
Enable JSON Object Mode by setting `response_format` to `{ "type": "json_object" }`.

  
**Requirements and limitations:**

* Include explicit JSON instructions in your prompt (system message or user input)
* Outputs are syntactically valid JSON but may not match your intended schema
* Combine with validation libraries and retry logic for schema compliance

### [Sentiment Analysis Example](#sentiment-analysis-example)

This example shows prompt-guided JSON generation for sentiment analysis, adaptable to classification, extraction, or summarization tasks:

Python

```
import { Groq } from "groq-sdk";

const groq = new Groq();

async function main() {
  const response = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: [
      {
        role: "system",
        content: `You are a data analysis API that performs sentiment analysis on text.
                Respond only with JSON using this format:
                {
                    "sentiment_analysis": {
                    "sentiment": "positive|negative|neutral",
                    "confidence_score": 0.95,
                    "key_phrases": [
                        {
                        "phrase": "detected key phrase",
                        "sentiment": "positive|negative|neutral"
                        }
                    ],
                    "summary": "One sentence summary of the overall sentiment"
                    }
                }`
      },
      { role: "user", content: "Analyze the sentiment of this customer review: 'I absolutely love this product! The quality exceeded my expectations, though shipping took longer than expected.'" }
    ],
    response_format: { type: "json_object" }
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");
  console.log(result);
}

main();
```

```
from groq import Groq
import json

client = Groq()

def main():
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": """You are a data analysis API that performs sentiment analysis on text.
                Respond only with JSON using this format:
                {
                    "sentiment_analysis": {
                    "sentiment": "positive|negative|neutral",
                    "confidence_score": 0.95,
                    "key_phrases": [
                        {
                        "phrase": "detected key phrase",
                        "sentiment": "positive|negative|neutral"
                        }
                    ],
                    "summary": "One sentence summary of the overall sentiment"
                    }
                }"""
            },
            {
                "role": "user", 
                "content": "Analyze the sentiment of this customer review: 'I absolutely love this product! The quality exceeded my expectations, though shipping took longer than expected.'"
            }
        ],
        response_format={"type": "json_object"}
    )

    result = json.loads(response.choices[0].message.content)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
```

```
curl https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.3-70b-versatile",
    "messages": [
      {
        "role": "system",
        "content": "You are a data analysis API that performs sentiment analysis on text. Respond only with JSON using this format: { \"sentiment_analysis\": { \"sentiment\": \"positive|negative|neutral\", \"confidence_score\": 0.95, \"key_phrases\": [ { \"phrase\": \"detected key phrase\", \"sentiment\": \"positive|negative|neutral\" } ], \"summary\": \"One sentence summary of the overall sentiment\" } }"
      },
      {
        "role": "user",
        "content": "Analyze the sentiment of this customer review: '\''I absolutely love this product! The quality exceeded my expectations, though shipping took longer than expected.'\''"
      }
    ],
    "response_format": { "type": "json_object" }
  }'
```

System prompts structure the output format while maintaining JSON validity. However, keep in mind that the JSON object output may not match your schema.

  
Example Output

JSON

```
{
  "sentiment_analysis": {
    "sentiment": "positive",
    "confidence_score": 0.84,
    "key_phrases": [
        {
            "phrase": "absolutely love this product",
            "sentiment": "positive"
        },
        {
            "phrase": "quality exceeded my expectations",
            "sentiment": "positive"
        }
    ],
    "summary": "The reviewer loves the product's quality, but was slightly disappointed with the shipping time."
  }
}
```

  
**Response structure:**

* **sentiment**: Classification (positive/negative/neutral)
* **confidence\_score**: Confidence level (0-1 scale)
* **key\_phrases**: Extracted phrases with individual sentiment scores
* **summary**: Analysis overview and main findings