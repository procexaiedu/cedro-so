Failed to compile.
./src/lib/google-calendar/service.ts:111:7
Type error: Type 'Schema$Event' is not assignable to type 'GoogleCalendarEvent'.
  Types of property 'id' are incompatible.
    Type 'string | null | undefined' is not assignable to type 'string'.
      Type 'undefined' is not assignable to type 'string'.
  109 |       });
  110 |
> 111 |       return event;
      |       ^
  112 |     } catch (error) {
  113 |       await this.logSync({
  114 |         event_id: appointment.id,
Error: Command "npm run build" exited with 1