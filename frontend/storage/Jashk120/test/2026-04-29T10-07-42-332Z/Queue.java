```java
import java.util.LinkedList;

/**
 * A simple queue implementation using a LinkedList to store integers.
 * Provides FIFO (first-in, first-out) operations: enqueue, dequeue, and isEmpty.
 */
public class Queue {
    private LinkedList<Integer> list = new LinkedList<>();

    /**
     * Adds an integer value to the end of the queue.
     *
     * @param value the integer to be added to the queue
     */
    public void enqueue(int value) {
        list.addLast(value);
    }

    /**
     * Removes and returns the integer at the front of the queue.
     *
     * @return the integer removed from the front of the queue
     * @throws java.util.NoSuchElementException if the queue is empty
     */
    public int dequeue() {
        return list.removeFirst();
    }

    /**
     * Checks whether the queue contains no elements.
     *
     * @return true if the queue is empty, false otherwise
     */
    public boolean isEmpty() {
        return list.isEmpty();
    }
}
```