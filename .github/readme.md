# AceSurvey AI Agent Instructions

## Architecture Overview

AceSurvey is a full-stack survey management application built with:
- Backend: Laravel (PHP) API with service-oriented architecture
- Frontend: React + Vite with Tailwind CSS
- Database: MySQL/PostgreSQL (Laravel migrations)

### Key Components

1. **Survey Management Core**:
   - `app/Services/SurveyService.php`: Central business logic for survey CRUD
   - `app/Models/Survey.php`: Survey data model with relationships
   - Question types defined in `app/Enums/QuestionTypeEnum.php`: short answer, paragraph, dropdown, multiple choice, checkboxes

2. **Service Layer Pattern**:
   - Business logic encapsulated in `app/Services/`
   - Each service handles specific domain (Survey, Auth, Dashboard, etc.)
   - Transaction management for data consistency
   - Input sanitization and validation

3. **Security Features**:
   - Rate limiting (`app/Services/RateLimitService.php`)
   - Timing attack protection (`app/Services/TimingAttackProtection.php`)
   - Input sanitization using `strip_tags()`
   - Question limit enforcement (max 50 questions per survey)

## Development Workflow

### Setting Up the Project

1. Backend setup:
   ```bash
   composer install
   php artisan migrate
   php artisan serve
   ```

2. Frontend setup:
   ```bash
   cd react
   npm install
   npm run dev
   ```

### Key Patterns

1. **Survey Creation/Update**:
   - Questions are managed in transactions with their parent survey
   - Each question has type, description (optional), and data (JSON for options)
   - Questions are limited to 50 per survey

2. **Data Sanitization**:
   - All text inputs are sanitized using `strip_tags()`
   - Array inputs are JSON encoded after sanitization
   - SQL injection prevention using parameter binding

3. **Rate Limiting**:
   - Services use `RateLimitService` for throttling
   - Cache-based implementation with configurable limits

## Common Tasks

1. **Adding New Question Types**:
   - Add enum to `QuestionTypeEnum`
   - Update validation in `SurveyService::createQuestion()`
   - Add corresponding frontend component

2. **Extending Survey Features**:
   - Add fields to survey migration
   - Update `Survey` model
   - Modify `SurveyService` methods
   - Update corresponding API endpoints

3. **Performance Optimization**:
   - Use caching services (`SurveyCacheService`, `DashboardCacheService`)
   - Implement pagination (default 12 items per page)
   - Use eager loading for relationships

## Testing

- PHPUnit/Pest for backend testing
- Test files in `tests/Feature` and `tests/Unit`
- Frontend tests use Vite's test runner

## Common Pitfalls

1. Always use transactions for operations affecting multiple models
2. Remember to sanitize user inputs
3. Handle survey expiration checks using `isSurveyActive()`
4. Validate user authorization with `isUserAuthorized()`
