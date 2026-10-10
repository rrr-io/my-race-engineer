package org.mre.e1;

import org.mre.e1.model.Category;
import org.mre.e1.model.Phase;
import org.mre.e1.model.Proof;
import org.mre.e1.model.RaceState;
import org.mre.e1.repository.CategoryRepository;
import org.mre.e1.repository.ProofRepository;
import org.mre.e1.repository.RaceStateRepository;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.lang.reflect.Proxy;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;

/**
 * Plain test doubles: entities built without JPA, repositories as small in-memory fakes. No Spring context and no
 * database, so the tests run in milliseconds.
 */
public final class TestData {

    /** A 1x1 PNG: the smallest real image ProofService accepts. */
    public static final byte[] PNG = java.util.Base64.getDecoder().decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");

    private TestData() {
    }

    public static RaceState race(Phase phase, boolean pitStop, boolean practice) {
        RaceState state = construct(RaceState.class);
        set(state, "id", 1);
        set(state, "phase", phase);
        set(state, "pitStop", pitStop);
        set(state, "practice", practice);
        set(state, "updatedAt", Instant.parse("2026-10-01T00:00:00Z"));
        return state;
    }

    public static RaceStateRepository raceRepository(RaceState state) {
        return fake(RaceStateRepository.class, Map.of("findById", args -> Optional.of(state)));
    }

    public static Category category(long id, String name) {
        Category category = new Category(name, (int) id, Instant.parse("2026-10-01T00:00:00Z"));
        set(category, "id", id);
        return category;
    }

    public static CategoryRepository categoryRepository(List<Category> active) {
        return fake(CategoryRepository.class, Map.of(
                "findByActiveTrueOrderBySortOrderAscIdAsc", args -> active,
                "findById", args -> active.stream().filter(c -> c.getId().equals(args[0])).findFirst()));
    }

    /** Proofs kept in a list; save() gives them an id like the database would. */
    public static final class Proofs {
        public final List<Proof> all = new ArrayList<>();
        public final ProofRepository repository = fake(ProofRepository.class, Map.of(
                "findByCrewIdAndDay", args -> all.stream()
                        .filter(p -> p.getCrewId().equals(args[0]) && p.getDay().equals(args[1])).toList(),
                "save", args -> save((Proof) args[0]),
                "findById", args -> all.stream().filter(p -> p.getId().equals(args[0])).findFirst(),
                "countApprovedByTeam", args -> List.of()));

        private Proof save(Proof proof) {
            if (proof.getId() == null) {
                set(proof, "id", (long) all.size() + 1);
                all.add(proof);
            }
            return proof;
        }

        public Proof last() {
            return all.get(all.size() - 1);
        }

        public long count(UUID crewId, LocalDate day) {
            return all.stream().filter(p -> p.getCrewId().equals(crewId) && p.getDay().equals(day)).count();
        }
    }

    /** A repository interface implemented by the given methods; anything else fails loudly. */
    @SuppressWarnings("unchecked")
    public static <T> T fake(Class<T> type, Map<String, Function<Object[], Object>> methods) {
        return (T) Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[]{type}, (proxy, method, args) -> {
            switch (method.getName()) {
                case "toString": return "fake " + type.getSimpleName();
                case "hashCode": return System.identityHashCode(proxy);
                case "equals": return proxy == args[0];
                default:
                    Function<Object[], Object> body = methods.get(method.getName());
                    if (body == null) {
                        throw new UnsupportedOperationException(type.getSimpleName() + "." + method.getName());
                    }
                    return body.apply(args == null ? new Object[0] : args);
            }
        });
    }

    public static <T> T construct(Class<T> type) {
        try {
            Constructor<T> constructor = type.getDeclaredConstructor();
            constructor.setAccessible(true);
            return constructor.newInstance();
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(e);
        }
    }

    public static void set(Object target, String name, Object value) {
        for (Class<?> c = target.getClass(); c != null; c = c.getSuperclass()) {
            try {
                Field field = c.getDeclaredField(name);
                field.setAccessible(true);
                field.set(target, value);
                return;
            } catch (NoSuchFieldException e) {
                // look in the superclass
            } catch (IllegalAccessException e) {
                throw new IllegalStateException(e);
            }
        }
        throw new IllegalArgumentException("No field " + name + " on " + target.getClass());
    }

    public static Object get(Object target, String name) {
        try {
            Field field = target.getClass().getDeclaredField(name);
            field.setAccessible(true);
            return field.get(target);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(e);
        }
    }
}
