# Tasks
- [ ] Improve security by whitelisting functions allowed in client scripts 
1. [ ] Support document upload
2. [ ] Support image upload
3. [ ] Support time fields
3. [ ] Support Tabs or stepper forms
4. [ ] Support form data group (e.g give output data as grouped, choose which group the data key will be in)
Flat
```json
{
  "name": "john",
  "neighbors": 2 
}
```

Assume, user configures data group as `user` on the `name` field
```json
{
  "user": {
    "name": "john"
  },
  "neighbors": 2 
}
```
5. [ ] Create a highly customizable plugin
6. [ ] Destructure renderer and form builder
7. [ ] Make form data table include row id
8. [ ] Make table field accept an optional Data source to fetch from on init
9. [ ] Select field to optionally take a Data source together with a data mapper object
