import java.util.LinkedList;

/**
 * A simple queue implementation that stores integers using a LinkedList.
 * Provides standard queue operations: enqueue, dequeue, and isEmpty.
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
     * Removes and returns the integer from the front of the queue.
     *
     * @return the integer at the front of the queue
     * @throws java.util.NoSuchElementException if the queue is empty
     */
    public int dequeue() {
        return list.removeFirst();
    }

    /**
     * Checks whether the queue is empty.
     *
     * @return true if the queue contains no elements, false otherwise
     */
    public boolean isEmpty() {
        return list.isEmpty();
    }
}