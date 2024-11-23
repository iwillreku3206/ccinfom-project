import log from "log";
import { app } from "./app/server";

//@ts-ignore
import logNode from 'log-node'
logNode()

const port = parseInt(process.env.PORT || '3000')

app.listen(port, () => {
  log.info(`Listening on port ${port}`)
  log.info(`http://localhost:3000/`)
})
