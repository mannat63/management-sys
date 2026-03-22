require('dotenv').config({ path: '.env.local' });
import { sendEventToN8N } from './services/n8n.js';

async function test() {
  await sendEventToN8N({
    event_type: "test_result",
    timestamp: new Date().toISOString(),
    institute: { id: "123", name: "Test Inst" },
    student: { id: "456", name: "John Doe", parent_phone: "555", batch_name: "test" },
    data: { marks: 10, total_marks: 100 }
  });
  console.log("Done testing");
}
test();
